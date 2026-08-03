import { Reranker, RerankedResult } from './reranker.interface';
import appConfig from '../../../config/config';
import Logger from '../../../config/logger';

export class JinaRerankerService implements Reranker {
  async rerank(query: string, documents: string[], topN: number): Promise<RerankedResult[]> {
    const { apiKey, rerankerUrl, timeoutMs } = appConfig.jina;

    if (!apiKey) {
      throw new Error('Jina API Key is missing. Cannot perform reranking.');
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs || 10000);

      const response = await fetch(`${rerankerUrl || 'https://api.jina.ai'}/v1/rerank`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'jina-reranker-v2-base-multilingual',
          query,
          documents,
          top_n: topN
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Jina Reranker API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid response format from Jina Reranker API.');
      }

      // Map the results back to the expected RerankedResult interface
      return data.results.map((res: any) => ({
        index: res.index,
        relevance_score: res.relevance_score
      }));

    } catch (error: any) {
      Logger.error(`JinaRerankerService failed: ${error.message}`);
      throw error;
    }
  }
}
