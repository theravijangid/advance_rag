import { SourceParser, ParsedDocument, ParsedSection } from './parser.interface';
import { YouTubeTranscriptProvider, TranscriptSegment } from '../providers/youtube-transcript-provider.interface';
import { YTCaptionExtractor } from '../providers/yt-caption-extractor';
import { RapidApiTranscriptProvider } from '../providers/rapidapi-transcript-provider';
import Logger from '../../config/logger';

export function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname.includes('youtube.com') && parsed.searchParams.has('v')) {
      return parsed.searchParams.get('v');
    }

    if (hostname === 'youtu.be') {
      return parsed.pathname.slice(1) || null;
    }

    if (hostname.includes('youtube.com') && parsed.pathname.startsWith('/embed/')) {
      return parsed.pathname.replace('/embed/', '').split('/')[0] || null;
    }

    if (hostname.includes('youtube.com') && parsed.pathname.startsWith('/v/')) {
      return parsed.pathname.replace('/v/', '').split('/')[0] || null;
    }

    return null;
  } catch {
    return null;
  }
}

function groupSegmentsIntoChunks(
  segments: TranscriptSegment[],
  windowSeconds: number = 45
): ParsedSection[] {
  if (segments.length === 0) return [];

  const sections: ParsedSection[] = [];
  let currentTexts: string[] = [];
  let windowStart = segments[0].startTime;
  let windowEnd = segments[0].endTime;

  for (const segment of segments) {
    const windowDuration = segment.endTime - windowStart;

    if (windowDuration > windowSeconds && currentTexts.length > 0) {
      sections.push({
        text: currentTexts.join(' '),
        metadata: {
          startTime: windowStart,
          endTime: windowEnd,
        },
      });

      currentTexts = [];
      windowStart = segment.startTime;
    }

    currentTexts.push(segment.text);
    windowEnd = segment.endTime;
  }

  if (currentTexts.length > 0) {
    sections.push({
      text: currentTexts.join(' '),
      metadata: {
        startTime: windowStart,
        endTime: windowEnd,
      },
    });
  }

  return sections;
}

export class YouTubeParser implements SourceParser {
  private provider: YouTubeTranscriptProvider;

  constructor(provider?: YouTubeTranscriptProvider) {
    if (provider) {
      this.provider = provider;
    } else if (process.env.RAPIDAPI_KEY) {
      this.provider = new RapidApiTranscriptProvider();
    } else {
      this.provider = new YTCaptionExtractor();
    }
  }

  async parse(fileBuffer: Buffer): Promise<ParsedDocument> {
    const url = fileBuffer.toString('utf-8').trim();
    const videoId = extractVideoId(url);

    if (!videoId) {
      throw new Error(`Invalid YouTube URL: could not extract video ID from "${url}"`);
    }

    Logger.info(`YouTubeParser: Processing video ${videoId}`);

    const [metadata, segments] = await Promise.all([
      this.provider.getMetadata(videoId),
      this.provider.getTranscript(videoId),
    ]);

    if (segments.length === 0) {
      throw new Error(`No transcript available for YouTube video ${videoId}. Captions may be disabled.`);
    }

    Logger.info(`YouTubeParser: Got ${segments.length} transcript segments for video ${videoId}`);

    const sections = groupSegmentsIntoChunks(segments);

    for (const section of sections) {
      section.metadata.videoId = videoId;
      section.metadata.originalUrl = url;
    }

    return {
      metadata: {
        title: metadata.title,
        channelName: metadata.channelName,
        videoId,
        url,
        sourceType: 'youtube',
        segmentCount: segments.length,
        durationSeconds: segments.length > 0
          ? segments[segments.length - 1].endTime
          : 0,
      },
      sections,
    };
  }
}
