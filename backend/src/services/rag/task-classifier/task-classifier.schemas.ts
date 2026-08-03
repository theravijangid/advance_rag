import { z } from 'zod';

/**
 * Supported task types for Knowledge Requests.
 * Phase 3 includes: qa, summary, explain, compare, notes.
 * Interactive skills (quiz, interview) are deferred to Phase 4.
 */
export const TaskType = z.enum(['qa', 'summary', 'explain', 'compare', 'notes']);
export type TaskType = z.infer<typeof TaskType>;

/**
 * Zod schema for the Task Classifier's structured output.
 * All LLM classification outputs are validated against this schema.
 */
export const TaskClassificationSchema = z.object({
  task: TaskType,
  confidence: z.number().min(0).max(1),
  reason: z.string().max(200),
});

export type TaskClassification = z.infer<typeof TaskClassificationSchema>;

/**
 * Default fallback classification.
 * Used when deterministic rules don't match AND the LLM call fails.
 */
export const DEFAULT_CLASSIFICATION: TaskClassification = {
  task: 'qa',
  confidence: 1.0,
  reason: 'Default fallback to QA.',
};
