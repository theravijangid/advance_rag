import { systemPromptConfig } from '../../enums/system_prompts';
import { streamText } from 'ai';
import { ModelRegistry } from './model-registry.service';
import { enumConfig } from '../../enums/enums';

export class GeneralConversationService {
  static async chat(messages: any[], username: string = 'User', memoryContext: string = '') {
    const model = ModelRegistry.getModel(enumConfig.modelPurpose.generalConversation);

    const result = streamText({
      model,
      system: systemPromptConfig.GENERAL_CONVERSATION_SYSTEM_PROMPT(username, memoryContext),
      messages,
    });

    return { result };
  }
}
