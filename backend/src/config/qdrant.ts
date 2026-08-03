import { QdrantClient } from '@qdrant/js-client-rest'
import logger from './logger'

const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333'
const qdrantApiKey = process.env.QDRANT_API_KEY

export const qdrantClient = new QdrantClient({
  url: qdrantUrl,
  apiKey: qdrantApiKey || undefined,
})

export async function assertQdrantConnectionOk(): Promise<boolean> {
  try {
    const result = await qdrantClient.getCollections()
    logger.info(`Qdrant connection OK! Total collections: ${result.collections.length}`)
    return true
  } catch (error: any) {
    logger.warn(`Qdrant connection warning: ${error.message}. Ensure Qdrant server is running at ${qdrantUrl}`)
    return false
  }
}
