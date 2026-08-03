export interface ParsedSection {
  text: string;
  metadata: {
    pageNumber?: number;
    pageStart?: number;
    pageEnd?: number;
    startTime?: number;
    endTime?: number;
    heading?: string;
    [key: string]: any;
  };
}

export interface ParsedDocument {
  metadata: {
    title?: string;
    pageCount?: number;
    [key: string]: any;
  };
  sections: ParsedSection[];
}

export interface SourceParser {
  parse(fileBuffer: Buffer): Promise<ParsedDocument>;
}
