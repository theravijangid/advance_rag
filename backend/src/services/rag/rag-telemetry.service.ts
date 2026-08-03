import Logger from '../../config/logger';
import appConfig from '../../config/config';

export interface TracedChunk {
  chunkId: string;
  sourceId: string;
  sourceType: string;
  textPreview: string;
  denseScore: number;
  denseRank: number;
  rerankScore?: number;
  rerankRank?: number;
  rejectionReason?: string;
}

export interface RetrievalQueryTrace {
  label: string;                // e.g. 'original', 'rewritten', 'subquery-1'
  queryText: string;
  candidatesReturned: number;
  candidatesPassedThreshold: number;
}

export interface RerankingTrace {
  enabled: boolean;
  inputCount: number;
  scoreDistribution?: {
    min: number;
    max: number;
    median: number;
    mean: number;
  };
  majorRankShifts?: Array<{
    chunkId: string;
    sourceType: string;
    denseRank: number;
    rerankRank: number;
    denseScore: number;
    rerankScore: number;
    textPreview: string;
  }>;
}

export interface EvaluatorTrace {
  attempt: number;
  query: string;
  chunksEvaluated: number;
  sufficient: boolean;
  reason: string;
  fallbackQuery: string | null;
}

export interface DebugTrace {
  traceId: string;
  timestamp: string;
  originalQuery: string;
  config: {
    retrievalCandidates: number;
    contextTopK: number;
    minSimilarityScore: number;
    rerankingEnabled: boolean;
    routerEnabled: boolean;
    maxExpansionStrategies: number;
  };
  routing?: {
    complexity: string;
    rewrite: boolean;
    stepBack: boolean;
    decompose: boolean;
    hyde: boolean;
    reason: string;
  };
  expansions: Array<{ type: string; text: string }>;
  retrievalQueries: RetrievalQueryTrace[];
  allCandidates: TracedChunk[];
  reranking: RerankingTrace;
  evaluatorHistory: EvaluatorTrace[];
  finalContext: TracedChunk[];
  outcome: 'success' | 'fallback' | 'error';
  durationMs?: number;
}

export class RagTelemetry {
  private trace: DebugTrace;
  private startTime: number;

  constructor(originalQuery: string) {
    this.startTime = Date.now();
    this.trace = {
      traceId: `rag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      originalQuery,
      config: {
        retrievalCandidates: appConfig.rag.retrievalCandidates,
        contextTopK: appConfig.rag.contextTopK,
        minSimilarityScore: appConfig.rag.minSimilarityScore,
        rerankingEnabled: appConfig.rag.rerankingEnabled,
        routerEnabled: appConfig.rag.routerEnabled,
        maxExpansionStrategies: appConfig.rag.maxExpansionStrategies,
      },
      expansions: [],
      retrievalQueries: [],
      allCandidates: [],
      reranking: { enabled: appConfig.rag.rerankingEnabled, inputCount: 0 },
      evaluatorHistory: [],
      finalContext: [],
      outcome: 'success',
    };
  }

  static get enabled(): boolean {
    return appConfig.rag.debugEnabled;
  }

  get traceId(): string {
    return this.trace.traceId;
  }

  setRouting(decision: {
    complexity: string;
    rewrite: boolean;
    stepBack: boolean;
    decompose: boolean;
    hyde: boolean;
    reason: string;
  }): void {
    this.trace.routing = decision;
  }

  addExpansion(type: string, text: string): void {
    this.trace.expansions.push({ type, text });
  }

  addRetrievalQuery(trace: RetrievalQueryTrace): void {
    this.trace.retrievalQueries.push(trace);
  }

  setAllCandidates(candidates: TracedChunk[]): void {
    this.trace.allCandidates = candidates;
  }

  setReranking(rerankTrace: RerankingTrace): void {
    this.trace.reranking = rerankTrace;
  }

  addEvaluatorResult(result: EvaluatorTrace): void {
    this.trace.evaluatorHistory.push(result);
  }

  setFinalContext(chunks: TracedChunk[]): void {
    this.trace.finalContext = chunks;
  }

  finalise(outcome: 'success' | 'fallback' | 'error'): void {
    this.trace.outcome = outcome;
    this.trace.durationMs = Date.now() - this.startTime;

    Logger.info(`[RagTelemetry] ${this.trace.traceId} | outcome=${outcome} | query="${this.trace.originalQuery.slice(0, 80)}" | duration=${this.trace.durationMs}ms`);

    if (outcome === 'fallback' || outcome === 'error') {
      Logger.warn(`[RagTelemetry] FULL DEBUG TRACE:\n${JSON.stringify(this.trace, null, 2)}`);
    } else {
      Logger.debug(`[RagTelemetry] FULL DEBUG TRACE:\n${JSON.stringify(this.trace, null, 2)}`);
    }
  }

  getTrace(): DebugTrace {
    return this.trace;
  }
}
