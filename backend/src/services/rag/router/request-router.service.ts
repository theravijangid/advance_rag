import { generateObject } from 'ai';
import { z } from 'zod';
import { ModelRegistry } from '../model-registry.service';
import Logger from '../../../config/logger';
import { enumConfig } from '../../../enums/enums';
import { systemPromptConfig } from '../../../enums/system_prompts';

export type RequestRoute = 'GENERAL' | 'MEMORY' | 'KNOWLEDGE';

export interface RequestRoutingDecision {
  route: RequestRoute;
  reason: string;
  confidence: number;
}

export class RequestRouterService {
  static async route(messages: any[]): Promise<RequestRoutingDecision> {
    const model = ModelRegistry.getModel(enumConfig.modelPurpose.requestRouter);

    const recentMessages = messages.slice(-3);

    const systemPrompt = systemPromptConfig.REQUEST_ROUTER_SYSTEM_PROMPT;

    try {
      const { object } = await generateObject({
        model,
        system: systemPrompt,
        messages: recentMessages,
        schema: z.object({
          route: z.enum(['GENERAL', 'MEMORY', 'KNOWLEDGE']),
          reason: z.string(),
          confidence: z.number().min(0).max(1),
        }),
      });

      Logger.info(`[RequestRouterService] Routed to ${object.route} (Confidence: ${object.confidence}) - ${object.reason}`);
      return object;
    } catch (error) {
      Logger.error(`[RequestRouterService] Failed to route request, defaulting to KNOWLEDGE: ${error}`);
      return {
        route: 'KNOWLEDGE',
        reason: 'Fallback due to routing error',
        confidence: 0,
      };
    }
  }
}
