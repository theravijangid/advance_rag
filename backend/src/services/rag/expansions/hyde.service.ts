import { systemPromptConfig } from '../../../enums/system_prompts';
import { generateObject } from 'ai';
import { z } from 'zod';
import { ModelRegistry } from '../model-registry.service';
import Logger from '../../../config/logger';
import { enumConfig } from '../../../enums/enums';

const HyDEOutputSchema = z.object({
  hypotheticalDocument: z.string().min(10).max(2000),
});

export class HyDEService {
  static async generateHypothetical(query: string): Promise<string | null> {
    try {
      Logger.info(`[HyDEService] Generating hypothetical document...`);

      const model = ModelRegistry.getModel(enumConfig.modelPurpose.hyde);

      const { object } = await generateObject({
        model,
        schema: HyDEOutputSchema,
        system: systemPromptConfig.HYDE_SYSTEM_PROMPT,
        prompt: query,
        temperature: 0.3,
      });

      Logger.info(`[HyDEService] Generated hypothetical document (${object.hypotheticalDocument.length} chars).`);
      return object.hypotheticalDocument;

    } catch (error: any) {
      Logger.error(`[HyDEService] HyDE failed: ${error.message}. Skipping HyDE expansion.`);
      return null;
    }
  }
}
