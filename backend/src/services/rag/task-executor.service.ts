import { streamText } from 'ai';
import { ModelRegistry } from './model-registry.service';
import { SkillDefinition } from './skills/skill.types';
import Logger from '../../config/logger';
import { enumConfig } from '../../enums/enums';

export class TaskExecutorService {
  static execute(
    skill: SkillDefinition,
    contextString: string,
    messages: any[],
  ) {
    Logger.info(`[TaskExecutor] Executing skill: ${skill.id} (${skill.name})`);

    const contextBlock = `<untrusted_retrieved_context>\n${contextString}\n</untrusted_retrieved_context>`;
    const systemPrompt = skill.systemPrompt.replace('{context}', contextBlock);

    const model = ModelRegistry.getModel(enumConfig.modelPurpose.ragAnswer);
    const temperature = skill.temperature ?? 0.2;

    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      temperature,
    });

    return result;
  }
}
