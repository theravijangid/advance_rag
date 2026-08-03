import { SourceParser, ParsedDocument, ParsedSection } from './parser.interface';
import Logger from '../../config/logger';

export class TextParser implements SourceParser {
  async parse(fileBuffer: Buffer): Promise<ParsedDocument> {
    const content = fileBuffer.toString('utf-8');

    if (!content || content.trim().length === 0) {
      throw new Error('Empty text file');
    }

    Logger.info(`TextParser: Parsing text file (${content.length} chars)`);

    const normalized = content.replace(/\n{3,}/g, '\n\n').trim();

    const sections: ParsedSection[] = [{
      text: normalized,
      metadata: {},
    }];

    return {
      metadata: {
        sourceType: 'txt',
        charCount: normalized.length,
      },
      sections,
    };
  }
}
