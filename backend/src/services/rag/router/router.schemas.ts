import { z } from 'zod';

/**
 * Complexity classification for user queries.
 */
export const QueryComplexity = z.enum(['simple', 'moderate', 'complex']);
export type QueryComplexity = z.infer<typeof QueryComplexity>;

/**
 * Zod schema for the router's structured routing decision.
 * 
 * Strategies are non-exclusive — the router may enable multiple strategies
 * for a single query, subject to RAG_MAX_EXPANSION_STRATEGIES enforcement.
 */
export const RoutingDecisionSchema = z.object({
  complexity: QueryComplexity,
  rewrite: z.boolean(),
  stepBack: z.boolean(),
  decompose: z.boolean(),
  hyde: z.boolean(),
  reason: z.string().max(200),
});

export type RoutingDecision = z.infer<typeof RoutingDecisionSchema>;

/**
 * Direct retrieval fallback constant.
 * Used when routing fails or the router is disabled.
 */
export const DIRECT_RETRIEVAL_DECISION: RoutingDecision = {
  complexity: 'simple',
  rewrite: false,
  stepBack: false,
  decompose: false,
  hyde: false,
  reason: 'Direct retrieval fallback.',
};
