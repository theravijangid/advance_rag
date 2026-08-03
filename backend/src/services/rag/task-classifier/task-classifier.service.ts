import { systemPromptConfig } from '../../../enums/system_prompts';
import { generateObject } from 'ai';
import { ModelRegistry } from '../model-registry.service';
import {
  TaskType,
  TaskClassification,
  TaskClassificationSchema,
  DEFAULT_CLASSIFICATION,
} from './task-classifier.schemas';
import Logger from '../../../config/logger';
import { enumConfig } from '../../../enums/enums';

const DETERMINISTIC_RULES: Array<{ patterns: RegExp[]; task: TaskType }> = [
  {
    task: 'summary',
    patterns: [
      /\bsummar(y|ize|ise)\b/i,
      /\btldr\b/i,
      /\btl;dr\b/i,
      /\bgive\s+(me\s+)?(a\s+)?summary\b/i,
      /\boverview\s+of\b/i,
      /\bbrief\s+overview\b/i,
    ],
  },
  {
    task: 'notes',
    patterns: [
      /\b(generate|create|make|write|prepare)\s+(me\s+)?notes\b/i,
      /\bnote\s+this\b/i,
      /\bstudy\s+notes\b/i,
      /\brevision\s+notes\b/i,
    ],
  },
  {
    task: 'explain',
    patterns: [
      /\bexplain\s+(this|that|it|the|how|what|why)\b/i,
      /\bbreak\s+(it\s+)?down\b/i,
      /\bsimplify\s+(this|that|it|the)\b/i,
      /\bexplain\s+like\s+i'?m\b/i,
      /\beli5\b/i,
    ],
  },
  {
    task: 'compare',
    patterns: [
      /\bcompare\s+(and\s+)?(contrast\s+)?/i,
      /\bdifference(s)?\s+between\b/i,
      /\bvs\.?\b/i,
      /\bversus\b/i,
      /\bhow\s+(does|do|is|are)\s+.+\s+differ\b/i,
    ],
  },
];

const MAX_QUERY_INPUT_LENGTH = 1000;

export class TaskClassifierService {
  static async classify(query: string): Promise<TaskClassification> {
    const deterministicResult = this.classifyDeterministic(query);
    if (deterministicResult) {
      Logger.info(
        `[TaskClassifier] Deterministic match: task=${deterministicResult.task} | ${deterministicResult.reason}`
      );
      return deterministicResult;
    }

    try {
      const truncatedQuery = query.slice(0, MAX_QUERY_INPUT_LENGTH);

      Logger.info(
        `[TaskClassifier] No deterministic match, invoking LLM for: "${truncatedQuery.slice(0, 80)}..."`
      );

      const model = ModelRegistry.getModel(enumConfig.modelPurpose.taskClassifier);

      const { object } = await generateObject({
        model,
        schema: TaskClassificationSchema,
        system: systemPromptConfig.CLASSIFIER_SYSTEM_PROMPT,
        prompt: truncatedQuery,
        temperature: 0,
      });

      Logger.info(
        `[TaskClassifier] LLM classification: task=${object.task}, confidence=${object.confidence} | ${object.reason}`
      );

      return object;
    } catch (error: any) {
      Logger.error(
        `[TaskClassifier] LLM classification failed: ${error.message}. Falling back to QA.`
      );
      return DEFAULT_CLASSIFICATION;
    }
  }

  static classifyDeterministic(query: string): TaskClassification | null {
    const normalised = query.trim();

    for (const rule of DETERMINISTIC_RULES) {
      for (const pattern of rule.patterns) {
        if (pattern.test(normalised)) {
          return {
            task: rule.task,
            confidence: 1.0,
            reason: `Deterministic match: pattern "${pattern.source}" matched.`,
          };
        }
      }
    }

    return null;
  }
}
