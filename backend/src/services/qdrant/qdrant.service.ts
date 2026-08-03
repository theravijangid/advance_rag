import { QdrantClient } from '@qdrant/js-client-rest';
import appConfig from '../../config/config';
import Logger from '../../config/logger';

export interface QdrantPayload {
  workspaceId: string;
  sourceId: string;
  chunkIndex: number;
  text: string;
  [key: string]: unknown;
}

export class QdrantService {
  private readonly client: QdrantClient;
  private readonly collectionName: string;

  constructor() {
    this.client = new QdrantClient({
      url: appConfig.qdrant.url,
      apiKey: appConfig.qdrant.apiKey || undefined,
    });
    this.collectionName = appConfig.qdrant.collectionName;
  }

  async ensureCollectionExists(): Promise<void> {
    try {
      const { exists } = await this.client.collectionExists(this.collectionName);
      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: 1536, // text-embedding-3-small dimension
            distance: 'Cosine',
          },
        });
        Logger.info(`Created Qdrant collection: ${this.collectionName}`);
      }
    } catch (error: any) {
      Logger.error(`Failed to ensure Qdrant collection exists: ${error.message}`);
      throw error;
    }
  }

  async searchChunks(workspaceId: string, vector: number[], limit: number = 5) {
    const res = await this.client.search(this.collectionName, {
      vector,
      limit,
      filter: {
        must: [
          {
            key: 'workspaceId',
            match: { value: workspaceId },
          },
        ],
      },
      with_payload: true,
    });
    return res;
  }

  async upsertChunks(points: { id: string; vector: number[]; payload: QdrantPayload }[]): Promise<void> {
    try {
      await this.ensureCollectionExists();
      await this.client.upsert(this.collectionName, {
        wait: true,
        points: points,
      });
      Logger.info(`Upserted ${points.length} chunks to Qdrant`);
    } catch (error: any) {
      Logger.error(`Error upserting to Qdrant: ${error.message}`);
      throw new Error(`Qdrant upsert failed: ${error.message}`);
    }
  }
}

export default new QdrantService();
