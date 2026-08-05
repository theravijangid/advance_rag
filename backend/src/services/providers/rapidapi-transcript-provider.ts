import {
  YouTubeTranscriptProvider,
  TranscriptSegment,
  YouTubeVideoMetadata,
} from './youtube-transcript-provider.interface';
import Logger from '../../config/logger';
import axios from 'axios';

export class RapidApiTranscriptProvider implements YouTubeTranscriptProvider {
  async getTranscript(videoId: string): Promise<TranscriptSegment[]> {
    const apiKey = process.env.RAPIDAPI_KEY;
    const apiHost = process.env.RAPIDAPI_HOST || 'youtube-transcripts.p.rapidapi.com';
    
    if (!apiKey) {
      throw new Error('RAPIDAPI_KEY is not configured');
    }

    Logger.info(`RapidApiTranscriptProvider: Fetching transcript for ${videoId} via ${apiHost}`);

    try {
      let url = `https://${apiHost}/youtube/transcript?url=https://www.youtube.com/watch?v=${videoId}&chunkSize=500`;
      
      if (apiHost.includes('youtube-transcript3')) {
          const encodedUrl = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`);
          url = `https://${apiHost}/api/transcript-with-url?url=${encodedUrl}&lang=en`;
      } else if (apiHost.includes('youtube-transcript-api') || apiHost.includes('youtube-media-downloader')) {
          url = `https://${apiHost}/api/transcript?videoId=${videoId}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': apiHost,
        }
      });

      const data = response.data;
      let segments: any[] = [];
      
      if (Array.isArray(data)) {
        segments = data;
      } else if (data.content && Array.isArray(data.content)) {
        segments = data.content;
      } else if (data.transcript && Array.isArray(data.transcript)) {
        segments = data.transcript;
      } else if (data.items && Array.isArray(data.items)) {
        segments = data.items;
      } else if (data.subtitles && Array.isArray(data.subtitles)) {
        segments = data.subtitles;
      } else {
        throw new Error('RapidAPI returned an unexpected JSON structure');
      }

      return segments.map(seg => {
        const start = parseFloat(seg.start || seg.startTime || seg.offset || '0');
        const duration = parseFloat(seg.duration || seg.dur || '0');
        return {
          text: (seg.text || seg.content || '').trim(),
          startTime: start,
          endTime: start + duration
        };
      }).filter(seg => seg.text.length > 0);

    } catch (error: any) {
      Logger.error(`RapidApiTranscriptProvider error: ${error.message}`);
      throw new Error(`Failed to fetch transcript from RapidAPI: ${error.message}`);
    }
  }

  async getMetadata(videoId: string): Promise<YouTubeVideoMetadata> {
    Logger.info(`RapidApiTranscriptProvider: Fetching metadata for ${videoId} via oEmbed`);
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const response = await axios.get(oembedUrl);
      const data = response.data as { title?: string; author_name?: string; };
      return {
        title: data.title || `YouTube Video ${videoId}`,
        channelName: data.author_name || undefined,
      };
    } catch (error: any) {
      Logger.warn(`RapidAPI oEmbed fallback failed: ${error.message}`);
      return { title: `YouTube Video ${videoId}` };
    }
  }
}
