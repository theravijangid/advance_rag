import { generateObject } from 'ai';
import { ModelRegistry } from '../model-registry.service';
import { RoutingDecisionSchema, RoutingDecision, DIRECT_RETRIEVAL_DECISION } from './router.schemas';
import { buildRouterSystemPrompt } from './router.prompts';
import appConfig from '../../../config/config';
import Logger from '../../../config/logger';
import { enumConfig } from '../../../enums/enums';

const MAX_QUERY_INPUT_LENGTH = 2000;

const STRATEGY_PRIORITY: (keyof Pick<RoutingDecision, 'rewrite' | 'decompose' | 'stepBack' | 'hyde'>)[] = [
  'rewrite',
  'decompose',
  'stepBack',
  'hyde',
];

export class QueryRouterService {
  static async classifyQuery(query: string): Promise<RoutingDecision> {
    try {
      const truncatedQuery = query.slice(0, MAX_QUERY_INPUT_LENGTH);

      Logger.info(`[QueryRouter] Classifying query: "${truncatedQuery.slice(0, 100)}..."`);

      const model = ModelRegistry.getModel(enumConfig.modelPurpose.queryRouter);
      const systemPrompt = buildRouterSystemPrompt();

      const { object } = await generateObject({
        model,
        schema: RoutingDecisionSchema,
        system: systemPrompt,
        prompt: truncatedQuery,
        temperature: 0,
      });

      const enforced = this.enforceConstraints(object);

      Logger.info(`[QueryRouter] Decision: complexity=${enforced.complexity}, ` +
        `rewrite=${enforced.rewrite}, stepBack=${enforced.stepBack}, ` +
        `decompose=${enforced.decompose}, hyde=${enforced.hyde} | ${enforced.reason}`);

      return enforced;

    } catch (error: any) {
      Logger.error(`[QueryRouter] Classification failed: ${error.message}. Falling back to Direct Retrieval.`);
      return DIRECT_RETRIEVAL_DECISION;
    }
  }

  static enforceConstraints(decision: RoutingDecision): RoutingDecision {
    const result = { ...decision };
    const maxStrategies = appConfig.rag.maxExpansionStrategies;

    if (result.complexity === 'simple') {
      result.rewrite = false;
      result.stepBack = false;
      result.decompose = false;
      result.hyde = false;
      return result;
    }

    const enabledStrategies = STRATEGY_PRIORITY.filter(s => result[s]);

    if (enabledStrategies.length > maxStrategies) {
      const toKeep = new Set(enabledStrategies.slice(0, maxStrategies));
      
      for (const strategy of STRATEGY_PRIORITY) {
        if (result[strategy] && !toKeep.has(strategy)) {
          result[strategy] = false;
          Logger.debug(`[QueryRouter] Trimmed excess strategy: ${strategy}`);
        }
      }
    }

    return result;
  }
}
