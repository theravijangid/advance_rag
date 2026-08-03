import { getOptionalEnvVar, getRequiredEnvVar } from '../utils/env.util'

const appConfig = {
  port: getOptionalEnvVar('PORT', '3000'),
  log: {
    level: getOptionalEnvVar('LOG_LEVEL', 'info'),
  },
  filebase: {
    accessKeyId: getOptionalEnvVar('FILEBASE_ACCESS_KEY_ID', getOptionalEnvVar('ACCESS_KEY_ID', '')),
    secretAccessKey: getOptionalEnvVar('FILEBASE_SECRET_ACCESS_KEY', getOptionalEnvVar('SECRET_ACCESS_KEY', '')),
    bucket: getOptionalEnvVar('FILEBASE_BUCKET_NAME', 'adaptive-rag-sources'),
    region: getOptionalEnvVar('REGION', 'us-east-1'),
    endpoint: getOptionalEnvVar('FILEBASE_ENDPOINT', 'https://s3.filebase.io'),
    signatureVersion: 'v4',
  },
  openRouter: {
    apiKey: getRequiredEnvVar('OPENROUTER_API_KEY'),
    model: getOptionalEnvVar('RAG_ANSWER_MODEL', 'openai/gpt-4o-mini'),
    requestRouterModel: getOptionalEnvVar('REQUEST_ROUTER_MODEL', 'openai/gpt-4o-mini'),
    generalChatModel: getOptionalEnvVar('GENERAL_CHAT_MODEL', 'openai/gpt-4o-mini'),
  },
  qdrant: {
    url: getOptionalEnvVar('QDRANT_URL', 'http://localhost:6333'),
    apiKey: getOptionalEnvVar('QDRANT_API_KEY', ''),
    collectionName: getOptionalEnvVar('QDRANT_COLLECTION_NAME', 'workspace_chunks'),
  },
  jina: {
    apiKey: getOptionalEnvVar('JINA_API_KEY', ''),
    baseUrl: 'https://r.jina.ai',
    rerankerUrl: 'https://api.jina.ai',
    timeoutMs: 10,
  },
  rag: {
    retrievalCandidates: 20,
    contextTopK: 5,
    minSimilarityScore: 0.2,
    rerankingEnabled: getOptionalEnvVar('RAG_RERANKING_ENABLED', 'false') === 'false',
    routerEnabled: getOptionalEnvVar('RAG_ROUTER_ENABLED', 'true') === 'true',
    maxExpansionStrategies: 4,
    maxSubqueries: 5,
    routerModel: getOptionalEnvVar('RAG_ROUTER_MODEL', ''),
    expansionModel: getOptionalEnvVar('RAG_EXPANSION_MODEL', ''),
    debugEnabled: true,
  },
  mem0: {
    apiKey: getOptionalEnvVar('MEM0_API_KEY', ''),
  },
  ingest: {
    eventKey: getOptionalEnvVar('INNGEST_EVENT_KEY', ''),
  },
}

export default appConfig