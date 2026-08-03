import { SourceParser, ParsedDocument, ParsedSection } from './parser.interface';
import { WebContentExtractor } from '../providers/web-content-extractor.interface';
import { JinaExtractor } from '../providers/jina-extractor';
import Logger from '../../config/logger';

function splitMarkdownIntoSections(markdown: string): ParsedSection[] {
  const lines = markdown.split('\n');
  const sections: ParsedSection[] = [];
  const headingStack: string[] = [];

  let currentText = '';
  let currentHeading = '';
  let currentHeadingPath: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      // Flush current section if it has content
      if (currentText.trim().length > 0) {
        sections.push({
          text: currentText.trim(),
          metadata: {
            heading: currentHeading || undefined,
            headingPath: currentHeadingPath.length > 0 ? [...currentHeadingPath] : undefined,
          },
        });
      }

      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();

      // Maintain heading stack for hierarchy
      while (headingStack.length >= level) {
        headingStack.pop();
      }
      headingStack.push(headingText);

      currentHeading = headingText;
      currentHeadingPath = [...headingStack];
      currentText = '';
    } else {
      currentText += line + '\n';
    }
  }

  // Flush the final section
  if (currentText.trim().length > 0) {
    sections.push({
      text: currentText.trim(),
      metadata: {
        heading: currentHeading || undefined,
        headingPath: currentHeadingPath.length > 0 ? [...currentHeadingPath] : undefined,
      },
    });
  }

  // If no sections were created (no headings found), return a single section
  if (sections.length === 0 && markdown.trim().length > 0) {
    sections.push({
      text: markdown.trim(),
      metadata: {},
    });
  }

  return sections;
}

export class WebParser implements SourceParser {
  private extractor: WebContentExtractor;

  constructor(extractor?: WebContentExtractor) {
    this.extractor = extractor || new JinaExtractor();
  }
  
  async parse(fileBuffer: Buffer): Promise<ParsedDocument> {
    const url = fileBuffer.toString('utf-8').trim();

    Logger.info(`WebParser: Extracting content from ${url}`);

    const extracted = await this.extractor.extract(url);

    // Split the Markdown content into heading-aware sections
    const sections = splitMarkdownIntoSections(extracted.content);

    // Attach URL provenance to each section
    for (const section of sections) {
      section.metadata.originalUrl = extracted.url;
    }

    return {
      metadata: {
        title: extracted.title,
        url: extracted.url,
        sourceType: 'website',
      },
      sections,
    };
  }
}
