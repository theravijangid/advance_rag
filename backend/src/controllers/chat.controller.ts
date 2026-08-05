import { pipeUIMessageStreamToResponse, toUIMessageStream } from 'ai';
import { Request, Response } from 'express';
import { AdaptiveRagService } from '../services/rag/adaptive-rag.service';
import { Conversation } from '../models/conversation.model';
import { Message } from '../models/message.model';
import { RequestRouterService } from '../services/rag/router/request-router.service';
import { GeneralConversationService } from '../services/rag/general-conversation.service';
import { MemoryService } from '../services/memory/memory.service';
import { inngestClient } from '../services/queue/inngest.client';
import { PromptInjectionService } from '../services/security/prompt-injection.service';
import Logger from '../config/logger';
import apiResponseHandlingClass from '../helpers/api-response-handling.class';

export class ChatController {
  static async sendChatMessage(req: Request, res: Response) {
    const { workspaceId } = req.params;
    const { messages, conversationId: reqConversationId } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return apiResponseHandlingClass.handleBadRequest(res, 'Messages array is required.');
    }

    try {
      const userId = (req as any).user?.id || 'anonymous';
      
      const lastUserMsg = messages[messages.length - 1];
      
      const injectionDecision = await PromptInjectionService.evaluateInput(lastUserMsg.content);
      if (!injectionDecision.isSafe) {
        Logger.warn(`[ChatController] Prompt injection blocked: ${injectionDecision.reason}`);
        return apiResponseHandlingClass.handleBadRequest(res, 'Unsafe input detected: ' + (injectionDecision.reason || 'Prompt injection attempted.'));
      }

      const requestRoutingDecision = await RequestRouterService.route(messages);

      let result: any;
      let citationMap: any = {};
      let queryRoutingDecision: any;
      let correctiveHistory: any;
      let fallbackResponse: any;
      let taskClassification: any;

      if (requestRoutingDecision.route === 'GENERAL') {
        const lastUserMsgText = lastUserMsg.content || '';
        const memories = await MemoryService.searchMemory(userId, lastUserMsgText);
        const memoryList = Array.isArray(memories) ? memories : (memories as any).results || [];
        const memoryContext = memoryList.map((m: any) => `- ${m.memory}`).join('\n');

        const generalRes = await GeneralConversationService.chat(
          messages, 
          req.user?.firstName || 'User', 
          memoryContext
        );
        result = generalRes.result;
      } else if (requestRoutingDecision.route === 'MEMORY') {
        const memoryRes = await MemoryService.chatWithMemory(userId, messages);
        result = memoryRes.result;
      } else {
        const ragRes = await AdaptiveRagService.executeRagQuery(
          workspaceId,
          messages
        );
        result = ragRes.result;
        citationMap = ragRes.citationMap || {};
        queryRoutingDecision = ragRes.routingDecision;
        correctiveHistory = ragRes.correctiveHistory;
        fallbackResponse = ragRes.fallbackResponse;
        taskClassification = ragRes.taskClassification;
      }

      let conversationId = reqConversationId;
      if (!conversationId) {
        let title = lastUserMsg.content.trim();
        if (title.length > 40) {
          title = title.substring(0, 37) + '...';
        }

        const conversation = await Conversation.create({
          workspaceId,
          title,
        });
        conversationId = conversation.id;
      }

      await Message.create({
        conversationId,
        role: 'user',
        content: lastUserMsg.content,
      });

      if (fallbackResponse) {
        res.writeHead(200, {
          'Content-Type': 'text/plain; charset=utf-8',
          'x-vercel-ai-data-stream': 'v1'
        });
        res.write(`0:"${fallbackResponse}"\\n`);
        res.end();
        
        try {
          await Message.create({
            conversationId,
            role: 'assistant',
            content: fallbackResponse,
            citations: {},
          });
        } catch (dbErr) {
          Logger.error(`Failed to persist fallback message: ${dbErr}`);
        }
        return;
      }

      if (result) {
        pipeUIMessageStreamToResponse({
          response: res,
          stream: toUIMessageStream({
            stream: result.stream,
            messageMetadata: () => {
              const annotations = [];
              if (citationMap && Object.keys(citationMap).length > 0) {
                annotations.push({
                  type: 'citation-metadata',
                  citations: citationMap
                });
              }
              if (queryRoutingDecision) {
                annotations.push({
                  type: 'routing-decision',
                  decision: queryRoutingDecision
                });
              }
              if (requestRoutingDecision) {
                annotations.push({
                  type: 'request-routing-decision',
                  decision: requestRoutingDecision
                });
              }
              if (correctiveHistory && correctiveHistory.length > 0) {
                annotations.push({
                  type: 'corrective-history',
                  history: correctiveHistory
                });
              }
              if (taskClassification) {
                annotations.push({
                  type: 'task-classification',
                  classification: taskClassification
                });
              }
              return annotations.length > 0 ? { _annotations: annotations } : undefined;
            }
          })
        });
      }

      if (result) {
        result.text.then(async (fullText: string) => {
          try {
            const citationRegex = /\[C(\d+)\]/g;
            const validatedCitationMap: Record<string, any> = {};
            let match;
            
            while ((match = citationRegex.exec(fullText)) !== null) {
              const cId = `C${match[1]}`;
              if (citationMap[cId]) {
                validatedCitationMap[cId] = citationMap[cId];
              }
            }

            await Message.create({
              conversationId,
              role: 'assistant',
              content: fullText,
              citations: validatedCitationMap,
            });

            if (userId !== 'anonymous') {
              inngestClient.send({
                name: 'memory/extract',
                data: {
                  userId,
                  messages: [
                    { role: 'user' as const, content: lastUserMsg.content },
                    { role: 'assistant' as const, content: fullText }
                  ]
                }
              }).catch(err => Logger.error(`Failed to enqueue memory extraction: ${err}`));
            }
          } catch (dbErr) {
            Logger.error(`Failed to persist assistant message: ${dbErr}`);
          }
        }).catch((err: any) => {
          Logger.error(`Stream processing error for DB persistence: ${err}`);
        });
      }

    } catch (error: any) {
      Logger.error(`Chat Controller Error: ${error.message}`);
      if (!res.headersSent) {
        apiResponseHandlingClass.handleErrorReponse(res, error.message);
      }
    }
  }

  static async getConversation(req: Request, res: Response) {
    const { workspaceId, conversationId } = req.params;

    try {
      const conversation = await Conversation.findOne({
        where: { id: conversationId, workspaceId },
        include: [
          {
            model: Message,
            as: 'messages',
            order: [['createdAt', 'ASC']],
          }
        ]
      });

      if (!conversation) {
        return apiResponseHandlingClass.handleNotFoundRequest(res, 'Conversation not found');
      }

      const formattedMessages = conversation.messages.map((msg: any) => {
        const baseMsg: any = {
          id: msg.id,
          role: msg.role,
          content: msg.content,
        };
        
        if (msg.citations && Object.keys(msg.citations).length > 0) {
          if (!baseMsg.annotations) baseMsg.annotations = [];
          baseMsg.annotations.push({
            type: 'citation-metadata',
            citations: msg.citations
          });
        }
        
        return baseMsg;
      });

      apiResponseHandlingClass.handleSuccessResponse(res, 'Conversation fetched', {
        id: conversation.id,
        title: conversation.title,
        messages: formattedMessages
      });

    } catch (error: any) {
      Logger.error(`Chat Controller Error (getConversation): ${error.message}`);
      apiResponseHandlingClass.handleErrorReponse(res, error.message);
    }
  }
}
