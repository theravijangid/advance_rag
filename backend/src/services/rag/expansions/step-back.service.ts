import { systemPromptConfig } from '../../../enums/system_prompts';
import { generateObject } from 'ai';
import { z } from 'zod';
import { ModelRegistry } from '../model-registry.service';
import Logger from '../../../config/logger';
import { enumConfig } from '../../../enums/enums';

const StepBackOutputSchema = z.object({
  stepBackQuery: z.string().min(1).max(1000),
});

export class StepBackService {
  static async generateStepBack(query: string): Promise<string | null> {
    try {
      Logger.info(`[StepBackService] Generating step-back query...`);

      const model = ModelRegistry.getModel(enumConfig.modelPurpose.stepBack);

      const { object } = await generateObject({
        model,
        schema: StepBackOutputSchema,
        system: systemPromptConfig.STEP_BACK_SYSTEM_PROMPT,
        prompt: query,
        temperature: 0.1,
      });

      Logger.info(`[StepBackService] Step-back: "${object.stepBackQuery.slice(0, 100)}"`);
      return object.stepBackQuery;

    } catch (error: any) {
      Logger.error(`[StepBackService] Step-back failed: ${error.message}. Skipping step-back expansion.`);
      return null;
    }
  }
}
