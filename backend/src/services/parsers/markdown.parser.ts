import { SourceParser, ParsedDocument, ParsedSection } from './parser.interface';
import Logger from '../../config/logger';

interface HeadingSection {
  heading: string;
  level: number;
  headingPath: string[];
  text: string;
}

function parseMarkdownSections(content: string): HeadingSection[] {
  const lines = content.split('\n');
  const results: HeadingSection[] = [];
  const headingStack: { level: number; text: string }[] = [];

  let currentHeading = '';
  let currentLevel = 0;
  let currentText = '';
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      currentText += line + '\n';
      continue;
    }

    if (inCodeBlock) {
      currentText += line + '\n';
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      if (currentText.trim().length > 0 || results.length > 0) {
        const headingPath = headingStack.map(h => h.text);
        results.push({
          heading: currentHeading,
          level: currentLevel,
          headingPath: headingPath.length > 0 ? [...headingPath] : [],
          text: currentText.trim(),
        });
      }

      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();

      while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
        headingStack.pop();
      }
      headingStack.push({ level, text: headingText });

      currentHeading = headingText;
      currentLevel = level;
      currentText = '';
    } else {
      currentText += line + '\n';
    }
  }

  const finalPath = headingStack.map(h => h.text);
  if (currentText.trim().length > 0) {
    results.push({
      heading: currentHeading,
      level: currentLevel,
      headingPath: finalPath.length > 0 ? [...finalPath] : [],
      text: currentText.trim(),
    });
  }

  return results;
}

export class MarkdownParser implements SourceParser {
  async parse(fileBuffer: Buffer): Promise<ParsedDocument> {
    const content = fileBuffer.toString('utf-8');

    if (!content || content.trim().length === 0) {
      throw new Error('Empty markdown file');
    }

    Logger.info(`MarkdownParser: Parsing markdown file (${content.length} chars)`);

    const headingSections = parseMarkdownSections(content);

    let sections: ParsedSection[];

    if (headingSections.length === 0 || (headingSections.length === 1 && !headingSections[0].heading)) {
      Logger.info('MarkdownParser: No headings found, treating as flat text');
      sections = [{
        text: content.trim(),
        metadata: {},
      }];
    } else {
      sections = headingSections
        .filter(s => s.text.length > 0)
        .map(s => ({
          text: s.text,
          metadata: {
            heading: s.heading || undefined,
            headingPath: s.headingPath.length > 0 ? s.headingPath : undefined,
          },
        }));
    }

    if (sections.length === 0) {
      throw new Error('Markdown file contains no parseable content');
    }

    return {
      metadata: {
        sourceType: 'markdown',
        sectionCount: sections.length,
        charCount: content.length,
      },
      sections,
    };
  }
}
