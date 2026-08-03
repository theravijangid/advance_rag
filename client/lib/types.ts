export type SourceType =
  | "pdf"
  | "website"
  | "youtube"
  | "text"
  | "markdown"
  | "vtt"
  | "srt";

export type SourceStatus =
  | "UPLOADING"
  | "QUEUED"
  | "PARSING"
  | "CHUNKING"
  | "EMBEDDING"
  | "READY"
  | "FAILED";

export type Source = {
  id: string;
  name: string;
  type: SourceType;
  status: SourceStatus;
  meta?: string;
  pages?: number;
  duration?: string;
};

export type Citation = {
  id: string;
  sourceId: string;
  sourceType: SourceType;
  sourceName: string;
  snippet?: string;
  excerpt?: string;
  page?: number;
  pageNumber?: number;
  startTime?: number;
  endTime?: number;
  heading?: string;
  headingPath?: string[];
  url?: string;
  videoId?: string;
  speaker?: string;
  // Metadata exposed when Developer Mode is enabled
  score?: number;
  denseRank?: number;
  rerankScore?: number;
  rerankRank?: number;
};

export type RetrievalDetails = {
  originalQuery: string;
  rewrittenQuery: string;
  strategies: {
    rewrite: boolean;
    hybrid: boolean;
    rerank: boolean;
    stepBack: boolean;
    hyde: boolean;
    decomposition: boolean;
  };
  candidatesConsidered: number;
  candidatesSelected: number;
  chunks: Array<{
    citationId: string;
    sourceName: string;
    locator: string;
    similarity: number;
    rerank: number;
  }>;
  evaluation: {
    groundedness: number;
    relevance: number;
    completeness: number;
    attempts: number;
  };
};

export type ChatMessage =
  | { id: string; role: "user"; content: string }
  | {
      id: string;
      role: "assistant";
      segments: Array<
        | { type: "text"; content: string }
        | { type: "citation"; citationId: string; label: number }
      >;
      followUps?: string[];
      retrieval?: RetrievalDetails;
    };

export type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
};

export type Workspace = {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  sources: Source[];
  conversations: Conversation[];
};
