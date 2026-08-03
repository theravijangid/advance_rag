import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import appConfig from '../../config/config';
import Logger from '../../config/logger';

export type ModelPurpose = 
  | 'rag-answer' 
  | 'query-router'
  | 'query-rewrite' 
  | 'hyde' 
  | 'step-back' 
  | 'decomposition' 
  | 'evaluation'
  | 'guardrail'
  | 'request-router'
  | 'general-conversation'
  | 'task-classifier';

export class ModelRegistry {
  private static getOpenRouterInstance() {
    if (!appConfig.openRouter.apiKey) {
      Logger.warn('OPENROUTER_API_KEY is not set. LLM calls will fail.');
    }
    
    return createOpenRouter({
      apiKey: appConfig.openRouter.apiKey,
    });
  }

  static getModel(purpose: ModelPurpose) {
    const openrouter = this.getOpenRouterInstance();

    switch (purpose) {
      case 'rag-answer': {
        const modelName = appConfig.openRouter.model || 'openai/gpt-4o-mini';
        return openrouter(modelName);
      }

      case 'query-router': {
        const routerModel = appConfig.rag.routerModel || appConfig.rag.expansionModel || appConfig.openRouter.model || 'openai/gpt-4o-mini';
        return openrouter(routerModel);
      }

      case 'query-rewrite':
      case 'hyde':
      case 'step-back':
      case 'decomposition': {
        const expansionModel = appConfig.rag.expansionModel || appConfig.openRouter.model || 'openai/gpt-4o-mini';
        return openrouter(expansionModel);
      }
        
      case 'evaluation':
      case 'guardrail': {
        const evaluationModel = appConfig.rag.expansionModel || appConfig.openRouter.model || 'openai/gpt-4o-mini';
        return openrouter(evaluationModel);
      }
      case 'request-router': {
        const requestRouterModel = appConfig.openRouter.requestRouterModel || 'openai/gpt-4o-mini';
        return openrouter(requestRouterModel);
      }
      case 'general-conversation': {
        const generalChatModel = appConfig.openRouter.generalChatModel || 'openai/gpt-4o-mini';
        return openrouter(generalChatModel);
      }
      case 'task-classifier': {
        const classifierModel = appConfig.rag.expansionModel || appConfig.openRouter.model || 'openai/gpt-4o-mini';
        return openrouter(classifierModel);
      }
      default:
        throw new Error(`Unknown model purpose: ${purpose}`);
    }
  }
}

