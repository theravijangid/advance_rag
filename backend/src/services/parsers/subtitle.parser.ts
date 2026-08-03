import { SourceParser, ParsedDocument, ParsedSection } from './parser.interface';
import Logger from '../../config/logger';

interface TimestampedSegment {
  text: string;
  startTime: number;
  endTime: number;
  speaker?: string;
}

function parseVttTimestamp(ts: string): number {
  const parts = ts.trim().split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }
  return 0;
}

/** Parse SRT timestamp format: HH:MM:SS,mmm */
function parseSrtTimestamp(ts: string): number {
  // SRT uses comma for milliseconds: 00:01:20,500
  return parseVttTimestamp(ts.replace(',', '.'));
}

/** Strip HTML/formatting tags from subtitle text */
function stripTags(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')          // HTML tags
    .replace(/\{[^}]*\}/g, '')        // SSA/ASS style tags
    .replace(/\r/g, '')               // carriage returns
    .trim();
}

/** Extract speaker from VTT <v Speaker> tag or SRT [Speaker]: prefix */
function extractSpeaker(text: string): { speaker?: string; cleanText: string } {
  // VTT voice tag: <v Speaker Name>text</v>
  const vttMatch = text.match(/^<v\s+([^>]+)>/i);
  if (vttMatch) {
    const speaker = vttMatch[1].trim();
    const cleanText = text.replace(/<\/?v[^>]*>/gi, '').trim();
    return { speaker, cleanText };
  }

  // SRT convention: [Speaker]: text or Speaker: text (at start of line)
  const srtMatch = text.match(/^\[?([A-Za-z\s]+)\]?:\s*/);
  if (srtMatch && srtMatch[1].length < 30) {
    const speaker = srtMatch[1].trim();
    const cleanText = text.slice(srtMatch[0].length).trim();
    return { speaker, cleanText };
  }

  return { cleanText: text };
}

/** Parse WebVTT content into TimestampedSegments */
function parseVtt(content: string): TimestampedSegment[] {
  const segments: TimestampedSegment[] = [];
  const lines = content.split('\n');
  let i = 0;

  // Skip WEBVTT header and any metadata
  while (i < lines.length && !lines[i].includes('-->')) {
    i++;
  }

  while (i < lines.length) {
    const line = lines[i].trim();

    // Look for timestamp line: 00:00:01.000 --> 00:00:04.000
    const tsMatch = line.match(/(\d[\d:.]+)\s*-->\s*(\d[\d:.]+)/);
    if (tsMatch) {
      const startTime = parseVttTimestamp(tsMatch[1]);
      const endTime = parseVttTimestamp(tsMatch[2]);

      // Collect text lines until empty line or next timestamp
      const textLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== '' && !lines[i].includes('-->')) {
        textLines.push(lines[i].trim());
        i++;
      }

      const rawText = textLines.join(' ');
      const cleaned = stripTags(rawText);
      if (cleaned.length > 0) {
        const { speaker, cleanText } = extractSpeaker(cleaned);
        segments.push({ text: cleanText, startTime, endTime, speaker });
      }
    } else {
      i++;
    }
  }

  return segments;
}

/** Parse SRT content into TimestampedSegments */
function parseSrt(content: string): TimestampedSegment[] {
  const segments: TimestampedSegment[] = [];
  // SRT blocks are separated by blank lines
  const blocks = content.split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    // Find the timestamp line (may be line 1 or line 0 if no sequence number)
    let tsLine: string | null = null;
    let textStartIdx = 0;

    for (let i = 0; i < Math.min(lines.length, 3); i++) {
      if (lines[i].includes('-->')) {
        tsLine = lines[i];
        textStartIdx = i + 1;
        break;
      }
    }

    if (!tsLine) continue;

    const tsMatch = tsLine.match(/([\d:,]+)\s*-->\s*([\d:,]+)/);
    if (!tsMatch) continue;

    const startTime = parseSrtTimestamp(tsMatch[1]);
    const endTime = parseSrtTimestamp(tsMatch[2]);

    const rawText = lines.slice(textStartIdx).join(' ');
    const cleaned = stripTags(rawText);
    if (cleaned.length > 0) {
      const { speaker, cleanText } = extractSpeaker(cleaned);
      segments.push({ text: cleanText, startTime, endTime, speaker });
    }
  }

  return segments;
}

/** Group timestamp segments into 30-60 second chunks (shared logic) */
function groupIntoChunks(segments: TimestampedSegment[], windowSeconds: number = 45): ParsedSection[] {
  if (segments.length === 0) return [];

  const sections: ParsedSection[] = [];
  let currentTexts: string[] = [];
  let windowStart = segments[0].startTime;
  let windowEnd = segments[0].endTime;
  let currentSpeaker: string | undefined = segments[0].speaker;

  for (const segment of segments) {
    const windowDuration = segment.endTime - windowStart;

    if (windowDuration > windowSeconds && currentTexts.length > 0) {
      sections.push({
        text: currentTexts.join(' '),
        metadata: {
          startTime: windowStart,
          endTime: windowEnd,
          speaker: currentSpeaker,
        },
      });
      currentTexts = [];
      windowStart = segment.startTime;
      currentSpeaker = segment.speaker;
    }

    currentTexts.push(segment.text);
    windowEnd = segment.endTime;
    // Track the most recent speaker
    if (segment.speaker) currentSpeaker = segment.speaker;
  }

  if (currentTexts.length > 0) {
    sections.push({
      text: currentTexts.join(' '),
      metadata: {
        startTime: windowStart,
        endTime: windowEnd,
        speaker: currentSpeaker,
      },
    });
  }

  return sections;
}

export class SubtitleParser implements SourceParser {
  private format: 'vtt' | 'srt';

  constructor(format: 'vtt' | 'srt') {
    this.format = format;
  }

  async parse(fileBuffer: Buffer): Promise<ParsedDocument> {
    const content = fileBuffer.toString('utf-8');

    if (!content || content.trim().length === 0) {
      throw new Error(`Empty ${this.format.toUpperCase()} subtitle file`);
    }

    Logger.info(`SubtitleParser: Parsing ${this.format.toUpperCase()} file (${content.length} chars)`);

    const segments = this.format === 'vtt' ? parseVtt(content) : parseSrt(content);

    if (segments.length === 0) {
      throw new Error(`No parseable subtitle cues found in ${this.format.toUpperCase()} file`);
    }

    Logger.info(`SubtitleParser: Parsed ${segments.length} cues from ${this.format.toUpperCase()} file`);

    const sections = groupIntoChunks(segments);

    const lastSegment = segments[segments.length - 1];

    return {
      metadata: {
        sourceType: this.format,
        cueCount: segments.length,
        durationSeconds: lastSegment ? lastSegment.endTime : 0,
      },
      sections,
    };
  }
}
