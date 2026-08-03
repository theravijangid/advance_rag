import { systemPromptConfig } from '../../enums/system_prompts';
import { generateObject } from 'ai';
import { z } from 'zod';
import { ModelRegistry } from '../rag/model-registry.service';
import Logger from '../../config/logger';

const InjectionDetectorSchema = z.object({
  isSafe: z.boolean(),
  reason: z.string().max(200),
});

export type InjectionDecision = z.infer<typeof InjectionDetectorSchema>;

export class PromptInjectionService {
  static async evaluateInput(query: string): Promise<InjectionDecision> {
    try {
      if (!query || query.trim().length === 0) {
        return { isSafe: true, reason: 'Empty input' };
      }

      const prompt = `USER INPUT TO EVALUATE:\n${query}`;

      const model = ModelRegistry.getModel('guardrail');

      const { object } = await generateObject({
        model,
        schema: InjectionDetectorSchema,
        system: systemPromptConfig.GUARDRAIL_SYSTEM_PROMPT,
        prompt,
        temperature: 0,
      });

      if (!object.isSafe) {
        Logger.warn(`[PromptInjectionService] Injection detected. Reason: ${object.reason}`);
      }
      
      return object;
    } catch (error: any) {
      Logger.error(`[PromptInjectionService] Evaluation failed: ${error.message}. Defaulting to safe to prevent outage.`);
      return { isSafe: true, reason: 'Error while evaluating input' };
    }
  }
}
