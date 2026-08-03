export interface TranscriptSegment {
  text: string;
  startTime: number;
  endTime: number;
}

export interface YouTubeVideoMetadata {
  title: string;
  channelName?: string;
}

export interface YouTubeTranscriptProvider {
  getTranscript(videoId: string): Promise<TranscriptSegment[]>;
  getMetadata(videoId: string): Promise<YouTubeVideoMetadata>;
}
