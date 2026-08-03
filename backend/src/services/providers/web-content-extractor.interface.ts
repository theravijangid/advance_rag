export interface ExtractedWebContent {
  title: string;
  content: string;
  url: string;
}

export interface WebContentExtractor {
  extract(url: string): Promise<ExtractedWebContent>;
}
