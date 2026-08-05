import {
  YouTubeTranscriptProvider,
  TranscriptSegment,
  YouTubeVideoMetadata,
} from './youtube-transcript-provider.interface';
import Logger from '../../config/logger';
import { ProxyAgent, fetch as undiciFetch } from 'undici';

let getSubtitles: any;
let getVideoDetails: any;

async function loadLibrary() {
  if (!getSubtitles) {
    try {
      const lib = await import('youtube-caption-extractor');
      getSubtitles = lib.getSubtitles || lib.default?.getSubtitles;
      getVideoDetails = lib.getVideoDetails || lib.default?.getVideoDetails;
    } catch (error: any) {
      throw new Error(
        `Failed to load youtube-caption-extractor: ${error.message}. ` +
        'Ensure the package is installed: npm install youtube-caption-extractor'
      );
    }
  }
}

export class YTCaptionExtractor implements YouTubeTranscriptProvider {
  private getCustomFetch() {
    const proxyUrl = process.env.YOUTUBE_PROXY_URL;
    if (proxyUrl) {
      Logger.info(`YTCaptionExtractor: Using proxy for YouTube request`);
      const dispatcher = new ProxyAgent(proxyUrl);
      return (url: string | URL | globalThis.Request, init?: any) => 
        undiciFetch(url as any, { ...init, dispatcher }) as unknown as Promise<Response>;
    }
    return fetch;
  }

  async getTranscript(videoId: string): Promise<TranscriptSegment[]> {
    await loadLibrary();

    Logger.info(`YTCaptionExtractor: Fetching transcript for video ${videoId}`);

    try {
      const customFetch = this.getCustomFetch();
      const subtitles = await getSubtitles({ videoID: videoId, lang: 'en', fetch: customFetch as any });

      if (!subtitles || subtitles.length === 0) {
        // Try without language specification as fallback
        const fallback = await getSubtitles({ videoID: videoId, fetch: customFetch as any });
        if (!fallback || fallback.length === 0) {
          throw new Error(`No transcript available for video ${videoId}. Captions may be disabled.`);
        }
        return this.normalizeSubtitles(fallback);
      }

      return this.normalizeSubtitles(subtitles);
    } catch (error: any) {
      Logger.error(`YTCaptionExtractor transcript error: ${error.message}`);
      if (error.message.includes('No transcript available')) {
        throw error;
      }
      throw new Error(`Failed to fetch YouTube transcript for video ${videoId}: ${error.message}`);
    }
  }

  async getMetadata(videoId: string): Promise<YouTubeVideoMetadata> {
    Logger.info(`YTCaptionExtractor: Fetching metadata for video ${videoId}`);

    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const customFetch = this.getCustomFetch();
      const response = await customFetch(oembedUrl);

      if (!response.ok) {
        throw new Error(`YouTube oEmbed returned ${response.status}`);
      }

      const data = await response.json() as {
        title?: string;
        author_name?: string;
      };

      return {
        title: data.title || `YouTube Video ${videoId}`,
        channelName: data.author_name || undefined,
      };
    } catch (error: any) {
      Logger.warn(`Failed to fetch YouTube metadata via oEmbed: ${error.message}. Using fallback.`);
      return {
        title: `YouTube Video ${videoId}`,
      };
    }
  }

  private normalizeSubtitles(subtitles: any[]): TranscriptSegment[] {
    return subtitles.map((sub) => {
      const startTime = parseFloat(sub.start || sub.startTime || '0');
      const duration = parseFloat(sub.dur || sub.duration || '0');
      const endTime = startTime + duration;
      const text = (sub.text || sub.content || '').trim();

      return { text, startTime, endTime };
    }).filter((seg) => seg.text.length > 0);
  }
}
