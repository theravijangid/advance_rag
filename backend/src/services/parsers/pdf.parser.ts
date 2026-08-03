import { PDFParse } from 'pdf-parse';
import { SourceParser, ParsedDocument, ParsedSection } from "./parser.interface";
import Logger from "../../config/logger";

export class PDFParser implements SourceParser {
  async parse(fileBuffer: Buffer): Promise<ParsedDocument> {
    try {
      const sections: ParsedSection[] = [];
      const parser = new PDFParse({ data: fileBuffer });
      const textResult = await parser.getText();
      const infoResult = await parser.getInfo();

      for (const page of textResult.pages) {
        if (page.text && page.text.trim().length > 0) {
          sections.push({
            text: page.text,
            metadata: {
              pageNumber: page.num
            }
          });
        }
      }

      sections.sort((a, b) => (a.metadata.pageNumber || 0) - (b.metadata.pageNumber || 0));

      return {
        metadata: {
          pageCount: infoResult.total,
          title: infoResult.info?.Title || undefined,
          author: infoResult.info?.Author || undefined,
          creator: infoResult.info?.Creator || undefined,
        },
        sections
      };
    } catch (error: any) {
      Logger.error(`Error parsing PDF: ${error.message}`);
      throw new Error(`PDF Parsing failed: ${error.message}`);
    }
  }
}
