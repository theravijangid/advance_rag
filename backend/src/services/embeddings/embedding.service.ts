import { embed, embedMany } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import appConfig from '../../config/config';
import Logger from '../../config/logger';

export class EmbeddingService {
  private static getOpenRouterInstance() {
    if (!appConfig.openRouter.apiKey) {
      Logger.warn('OPENROUTER_API_KEY is not set. Embeddings will fail.');
    }
    
    return createOpenRouter({
      apiKey: appConfig.openRouter.apiKey || process.env.OPENROUTER_API_KEY,
    });
  }

  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (process.env.NODE_ENV === 'test' && !appConfig.openRouter.apiKey && !process.env.OPENROUTER_API_KEY) {
        return new Array(1536).fill(0.1);
      }

      const openrouter = this.getOpenRouterInstance();

      const { embedding } = await embed({
        model: openrouter.embedding('openai/text-embedding-3-small'),
        value: text,
      });

      return embedding;
    } catch (error: any) {
      Logger.error(`Error generating embedding: ${error.message}`);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  static async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    try {
      const openrouter = this.getOpenRouterInstance();
      const { embeddings } = await embedMany({
        model: openrouter.embedding('openai/text-embedding-3-small'),
        values: texts,
      });

      return embeddings;
    } catch (error: any) {
      Logger.error(`Error generating embeddings batch: ${error.message}`);
      throw new Error(`Failed to generate embeddings batch: ${error.message}`);
    }
  }
}
