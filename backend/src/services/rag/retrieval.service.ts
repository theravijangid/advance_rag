import appConfig from '../../config/config';
import Logger from '../../config/logger';
import { EmbeddingService } from '../embeddings/embedding.service';
import qdrantService, { QdrantPayload } from '../qdrant/qdrant.service';
import { Reranker } from './rerankers/reranker.interface';
import { JinaRerankerService } from './rerankers/jina-reranker.service';
import { QueryRepresentations } from './router/query-representations';
import { RagTelemetry, TracedChunk, RerankingTrace } from './rag-telemetry.service';

export interface RetrievedChunk {
  id: string;
  payload: QdrantPayload;
  score: number;
  denseRank: number;
  rerankScore?: number;
  rerankRank?: number;
}

const reranker: Reranker = new JinaRerankerService();

export class RetrievalService {
  static async retrieveContext(
    workspaceId: string,
    query: string
  ): Promise<RetrievedChunk[]> {
    const { retrievalCandidates, contextTopK, minSimilarityScore } = appConfig.rag;

    Logger.info(`[RetrievalService] Query: "${query}" | Workspace: ${workspaceId}`);
    Logger.debug(`[RetrievalService] Config - Candidates: ${retrievalCandidates}, TopK: ${contextTopK}, MinScore: ${minSimilarityScore}`);

    const [embedding] = await EmbeddingService.generateEmbeddingsBatch([query]);

    const searchResults = await qdrantService.searchChunks(workspaceId, embedding, retrievalCandidates);
    
    Logger.debug(`[RetrievalService] Qdrant returned ${searchResults.length} candidates.`);

    const filteredChunks: RetrievedChunk[] = [];
    let rank = 1;

    for (const res of searchResults) {
      const score = res.score ?? 0;
      
      if (score < minSimilarityScore) {
        Logger.debug(`[RetrievalService] Stopping at rank ${rank} due to score ${score} < ${minSimilarityScore}`);
        break;
      }

      filteredChunks.push({
        id: res.id as string,
        payload: res.payload as unknown as QdrantPayload,
        score,
        denseRank: rank,
      });

      rank++;
    }

    Logger.info(`[RetrievalService] ${filteredChunks.length} candidates passed the minimum score threshold.`);

    return this.deduplicateRerankTruncate(filteredChunks, query);
  }

  static async retrieveWithMultipleQueries(
    workspaceId: string,
    representations: QueryRepresentations,
    telemetry?: RagTelemetry,
    excludedChunkIds?: Set<string>
  ): Promise<RetrievedChunk[]> {
    const { retrievalCandidates, minSimilarityScore } = appConfig.rag;

    const queryTexts: string[] = [representations.original];
    const queryLabels: string[] = ['original'];

    if (representations.rewritten) {
      queryTexts.push(representations.rewritten);
      queryLabels.push('rewritten');
    }
    if (representations.stepBack) {
      queryTexts.push(representations.stepBack);
      queryLabels.push('stepBack');
    }
    if (representations.subqueries) {
      for (let i = 0; i < representations.subqueries.length; i++) {
        queryTexts.push(representations.subqueries[i]);
        queryLabels.push(`subquery-${i + 1}`);
      }
    }
    if (representations.hypotheticalDocument) {
      queryTexts.push(representations.hypotheticalDocument);
      queryLabels.push('hyde');
    }

    Logger.info(`[RetrievalService] Multi-query retrieval with ${queryTexts.length} representations: [${queryLabels.join(', ')}]`);

    const embeddings = await EmbeddingService.generateEmbeddingsBatch(queryTexts);

    Logger.info(`[RetrievalService] Generated embeddings for ${queryTexts.length} queries.`);

    const allChunksMap = new Map<string, RetrievedChunk>();

    for (let i = 0; i < embeddings.length; i++) {
      const searchResults = await qdrantService.searchChunks(workspaceId, embeddings[i], retrievalCandidates);
      
      Logger.debug(`[RetrievalService] ${queryLabels[i]} returned ${searchResults.length} candidates.`);

      let passedThreshold = 0;

      for (const res of searchResults) {
        const id = res.id as string;
        
        if (excludedChunkIds?.has(id)) {
          continue;
        }

        const score = res.score ?? 0;
        if (score < minSimilarityScore) continue;

        passedThreshold++;
        const existing = allChunksMap.get(id);

        if (!existing || score > existing.score) {
          allChunksMap.set(id, {
            id,
            payload: res.payload as unknown as QdrantPayload,
            score,
            denseRank: 0,
          });
        }
      }

      if (telemetry) {
        telemetry.addRetrievalQuery({
          label: queryLabels[i],
          queryText: queryTexts[i],
          candidatesReturned: searchResults.length,
          candidatesPassedThreshold: passedThreshold,
        });
      }
    }

    const mergedChunks = Array.from(allChunksMap.values())
      .sort((a, b) => b.score - a.score)
      .map((chunk, idx) => ({ ...chunk, denseRank: idx + 1 }));

    Logger.info(`[RetrievalService] ${mergedChunks.length} unique chunks after multi-query merge.`);

    return this.deduplicateRerankTruncate(mergedChunks, representations.original, telemetry);
  }

  private static async deduplicateRerankTruncate(
    chunks: RetrievedChunk[],
    originalQuery: string,
    telemetry?: RagTelemetry
  ): Promise<RetrievedChunk[]> {
    const { contextTopK } = appConfig.rag;

    // Exact Deduplication (by chunk ID)
    const uniqueChunks: RetrievedChunk[] = [];
    const seenIds = new Set<string>();
    
    for (const chunk of chunks) {
      if (!seenIds.has(chunk.id)) {
        seenIds.add(chunk.id);
        uniqueChunks.push(chunk);
      }
    }
    
    Logger.debug(`[RetrievalService] ${uniqueChunks.length} unique chunks after deduplication.`);

    let finalCandidates = uniqueChunks;

    if (appConfig.rag.rerankingEnabled && uniqueChunks.length > 0) {
      try {
        Logger.info(`[RetrievalService] Reranking ${uniqueChunks.length} chunks...`);
        const documents = uniqueChunks.map(c => c.payload.text as string);
        
        const rerankedResults = await reranker.rerank(originalQuery, documents, uniqueChunks.length);
        
        const rerankedChunks: RetrievedChunk[] = [];
        let rRank = 1;
        
        for (const res of rerankedResults) {
          const originalChunk = uniqueChunks[res.index];
          if (originalChunk) {
            rerankedChunks.push({
              ...originalChunk,
              rerankScore: res.relevance_score,
              rerankRank: rRank
            });
            rRank++;
          }
        }
        
        finalCandidates = rerankedChunks;
        Logger.info(`[RetrievalService] Reranking successful.`);

        if (telemetry) {
          const scores = rerankedChunks.map(c => c.rerankScore ?? 0);
          const sorted = [...scores].sort((a, b) => a - b);
          const medianIdx = Math.floor(sorted.length / 2);

          const majorShifts = rerankedChunks
            .filter(c => Math.abs((c.denseRank) - (c.rerankRank ?? c.denseRank)) >= 5)
            .slice(0, 10)
            .map(c => ({
              chunkId: c.id,
              sourceType: (c.payload.sourceType as string) || 'unknown',
              denseRank: c.denseRank,
              rerankRank: c.rerankRank ?? c.denseRank,
              denseScore: c.score,
              rerankScore: c.rerankScore ?? 0,
              textPreview: (c.payload.text as string).slice(0, 200),
            }));

          telemetry.setReranking({
            enabled: true,
            inputCount: uniqueChunks.length,
            scoreDistribution: sorted.length > 0 ? {
              min: sorted[0],
              max: sorted[sorted.length - 1],
              median: sorted[medianIdx],
              mean: scores.reduce((a, b) => a + b, 0) / scores.length,
            } : undefined,
            majorRankShifts: majorShifts.length > 0 ? majorShifts : undefined,
          });
        }
        
      } catch (error: any) {
        Logger.error(`[RetrievalService] Reranker failed: ${error.message}. Falling back to Dense Retrieval.`);
      }
    } else if (!appConfig.rag.rerankingEnabled) {
      Logger.debug(`[RetrievalService] Reranking is disabled via configuration.`);
      if (telemetry) {
        telemetry.setReranking({ enabled: false, inputCount: 0 });
      }
    }

    const finalContext = finalCandidates.slice(0, contextTopK);
    
    Logger.info(`[RetrievalService] Selected ${finalContext.length} chunks for final LLM context.`);

    if (telemetry) {
      const finalIds = new Set(finalContext.map(c => c.id));

      const allTracedCandidates: TracedChunk[] = finalCandidates.map(c => {
        const inFinal = finalIds.has(c.id);
        return {
          chunkId: c.id,
          sourceId: c.payload.sourceId as string,
          sourceType: (c.payload.sourceType as string) || 'unknown',
          textPreview: (c.payload.text as string).slice(0, 200),
          denseScore: c.score,
          denseRank: c.denseRank,
          rerankScore: c.rerankScore,
          rerankRank: c.rerankRank,
          rejectionReason: inFinal ? undefined : `Ranked outside Top-${contextTopK} (rank=${c.rerankRank ?? c.denseRank})`,
        };
      });

      telemetry.setAllCandidates(allTracedCandidates);
      telemetry.setFinalContext(allTracedCandidates.filter(c => !c.rejectionReason));
    }
    
    return finalContext;
  }
}

