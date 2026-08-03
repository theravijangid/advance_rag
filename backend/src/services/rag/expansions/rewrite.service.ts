import { systemPromptConfig } from '../../../enums/system_prompts';
import { generateObject } from 'ai';
import { z } from 'zod';
import { ModelRegistry } from '../model-registry.service';
import Logger from '../../../config/logger';
import { enumConfig } from '../../../enums/enums';

const RewriteOutputSchema = z.object({
  rewrittenQuery: z.string().min(1).max(1000),
});

export class RewriteService {
  static async rewrite(query: string): Promise<string | null> {
    try {
      Logger.info(`[RewriteService] Rewriting query...`);

      const model = ModelRegistry.getModel(enumConfig.modelPurpose.queryRewrite);

      const { object } = await generateObject({
        model,
        schema: RewriteOutputSchema,
        system: systemPromptConfig.REWRITE_SYSTEM_PROMPT,
        prompt: query,
        temperature: 0.1,
      });

      Logger.info(`[RewriteService] Rewritten: "${object.rewrittenQuery.slice(0, 100)}"`);
      return object.rewrittenQuery;

    } catch (error: any) {
      Logger.error(`[RewriteService] Rewrite failed: ${error.message}. Skipping rewrite expansion.`);
      return null;
    }
  }
}
