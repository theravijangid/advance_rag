import { ParsedSection } from '../parsers/parser.interface';

export interface Chunk {
  text: string;
  metadata: {
    chunkIndex: number;
    [key: string]: any;
  };
}

export class ChunkingService {
  /**
   * Simple character-based chunking approximating 500-1000 tokens.
   * 1 token roughly = 4 characters.
   * 500 tokens = 2000 chars.
   * 15% overlap = ~300 chars.
   * 
   * This chunker operates on an array of sections (e.g. pages) to preserve 
   * provenance metadata like pageNumber for each chunk.
   */
  static chunkSections(sections: ParsedSection[], baseMetadata: any = {}): Chunk[] {
    const CHUNK_SIZE = 2500;
    const OVERLAP = 375;
    const chunks: Chunk[] = [];
    let chunkIndex = 0;

    for (const section of sections) {
      const text = section.text;
      if (!text || text.trim().length === 0) continue;

      let currentIndex = 0;
      while (currentIndex < text.length) {
        const end = Math.min(currentIndex + CHUNK_SIZE, text.length);
        const chunkText = text.slice(currentIndex, end);
        
        chunks.push({
          text: chunkText,
          metadata: {
            ...baseMetadata,
            ...section.metadata,
            chunkIndex,
          },
        });

        chunkIndex++;
        if (end >= text.length) break;
        
        currentIndex += CHUNK_SIZE - OVERLAP;
      }
    }

    return chunks;
  }
}
