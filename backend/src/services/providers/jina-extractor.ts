import { WebContentExtractor, ExtractedWebContent } from './web-content-extractor.interface';
import appConfig from '../../config/config';
import Logger from '../../config/logger';

export class JinaExtractor implements WebContentExtractor {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor() {
    this.baseUrl = appConfig.jina.baseUrl;
    this.apiKey = appConfig.jina.apiKey;
    this.timeoutMs = appConfig.jina.timeoutMs;
  }

  async extract(url: string): Promise<ExtractedWebContent> {
    const readerUrl = `${this.baseUrl}/${url}`;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'X-Return-Format': 'markdown',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    Logger.info(`JinaExtractor: Fetching content from ${url}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(readerUrl, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(
          `Jina Reader API returned ${response.status}: ${errorText}`
        );
      }

      const contentType = response.headers.get('content-type') || '';

      let title = '';
      let content = '';
      let canonicalUrl = url;

      if (contentType.includes('application/json')) {
        const json = await response.json() as {
          data?: { title?: string; content?: string; url?: string };
          title?: string;
          content?: string;
          url?: string;
        };

        const data = json.data || json;
        title = data.title || '';
        content = data.content || '';
        canonicalUrl = data.url || url;
      } else {
        content = await response.text();
      }

      if (!content || content.trim().length === 0) {
        throw new Error('Jina Reader returned no extractable content from the URL');
      }

      Logger.info(`JinaExtractor: Extracted ${content.length} chars from ${url}`);

      return { title, content, url: canonicalUrl };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Jina Reader request timed out after ${this.timeoutMs}ms for URL: ${url}`);
      }
      Logger.error(`JinaExtractor error: ${error.message}`);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
