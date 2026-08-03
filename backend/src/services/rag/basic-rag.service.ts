import { systemPromptConfig } from '../../enums/system_prompts';
import { streamText, UIMessage } from 'ai';
import { ModelRegistry } from './model-registry.service';
import { CitationBuilder, CitationMap } from './citation.builder';
import { RetrievalService } from './retrieval.service';
import Logger from '../../config/logger';

export class BasicRagService {
  /**
   * Executes a basic RAG query.
   * Embeds the latest user message, retrieves chunks, builds citation context,
   * and starts an LLM stream with the AI SDK.
   */
  static async executeRagQuery(
    workspaceId: string,
    messages: any[]
  ): Promise<{ result?: any; citationMap: CitationMap; fallbackResponse?: string }> {
    try {
      // Find the latest user message to use as the query
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== 'user') {
        throw new Error('The last message must be from the user.');
      }
      const query = lastMessage.content as string;

      Logger.info(`Executing Basic RAG for workspace ${workspaceId} with query: "${query}"`);

      // 1. Retrieve Candidate Context
      const chunks = await RetrievalService.retrieveContext(workspaceId, query);

      if (chunks.length === 0) {
        Logger.info(`[BasicRagService] No chunks survived filtering. Short-circuiting LLM.`);
        return {
          citationMap: {},
          fallbackResponse: "I couldn't find enough relevant information in the workspace sources to answer your question.",
        };
      }

      // 2. Build Citation Context
      const { contextString, citationMap } = CitationBuilder.buildContext(chunks);

      // 3. Construct System Prompt
      

      // 4. Invoke LLM via ModelRegistry & AI SDK
      const model = ModelRegistry.getModel('rag-answer');

      const result = streamText({
        model,
        system: systemPromptConfig.BASIC_RAG_SYSTEM_PROMPT(contextString),
        messages: messages, // Send full history
        temperature: 0.2, // Low temperature for factual RAG
      });

      return { result, citationMap };
    } catch (error: any) {
      Logger.error(`Basic RAG execution failed: ${error.message}`);
      throw error;
    }
  }
}
