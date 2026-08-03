import { QdrantPayload } from '../qdrant/qdrant.service'

export interface CitationPayload {
  chunkId: string | number
  chunkIndex?: number
  sourceId: string
  sourceType: string
  title?: string
  pageNumber?: number
  startTime?: number
  endTime?: number
  heading?: string
  headingPath?: string[]
  url?: string
  videoId?: string
  speaker?: string
  excerpt: string
  score?: number
  denseRank?: number
  rerankScore?: number
  rerankRank?: number
}

export type CitationMap = Record<string, CitationPayload>

export class CitationBuilder {
  static buildContext(
    chunks: {
      id: string | number
      payload: QdrantPayload
      score?: number
      denseRank?: number
      rerankScore?: number
      rerankRank?: number
    }[],
  ): { contextString: string; citationMap: CitationMap } {
    const citationMap: CitationMap = {}
    let contextString = ''

    chunks.forEach((chunk, index) => {
      const citationId = `C${index + 1}`

      citationMap[citationId] = {
        chunkId: chunk.id,
        chunkIndex: chunk.payload.chunkIndex as number | undefined,
        sourceId: chunk.payload.sourceId as string,
        sourceType: (chunk.payload.sourceType as string) || 'pdf',
        title: (chunk.payload.sourceName || chunk.payload.title) as string | undefined,
        pageNumber: chunk.payload.pageNumber as number | undefined,
        startTime: chunk.payload.startTime as number | undefined,
        endTime: chunk.payload.endTime as number | undefined,
        heading: (chunk.payload.heading || chunk.payload.sectionHeading) as string | undefined,
        headingPath: chunk.payload.headingPath as string[] | undefined,
        url: (chunk.payload.url || chunk.payload.originalUrl) as string | undefined,
        videoId: chunk.payload.videoId as string | undefined,
        speaker: chunk.payload.speaker as string | undefined,
        excerpt: chunk.payload.text as string,
        score: chunk.score,
        denseRank: chunk.denseRank,
        rerankScore: chunk.rerankScore,
        rerankRank: chunk.rerankRank,
      }

      contextString += `\n\n--- Document Snippet [${citationId}] ---\n`
      contextString += `${chunk.payload.text}\n`
    })

    return { contextString, citationMap }
  }
}
