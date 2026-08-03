import { useEffect, useRef } from "react";
import type { Citation } from "@/lib/types";

function fmt(t?: number) {
  if (t == null) return "--:--";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function extractVideoId(citation: Citation): string | null {
  if (citation.videoId) return citation.videoId;
  if (!citation.url) return null;
  try {
    const url = new URL(citation.url);
    // Standard: youtube.com/watch?v=VIDEO_ID
    if (url.searchParams.get("v")) return url.searchParams.get("v");
    // Short: youtu.be/VIDEO_ID
    if (url.hostname === "youtu.be") return url.pathname.slice(1);
    // Embed: youtube.com/embed/VIDEO_ID
    const embedMatch = url.pathname.match(/\/embed\/([^/?]+)/);
    if (embedMatch) return embedMatch[1];
  } catch {
    // fallback
  }
  return null;
}

export function YouTubeViewer({ citation }: { citation: Citation }) {
  const start = Math.floor(citation.startTime ?? 0);
  const videoId = extractVideoId(citation);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const prevStartRef = useRef<number>(start);

  // When citation changes (different startTime), reload the iframe to the new timestamp
  useEffect(() => {
    if (prevStartRef.current !== start && iframeRef.current && videoId) {
      iframeRef.current.src = buildEmbedUrl(videoId, start);
      prevStartRef.current = start;
    }
  }, [start, videoId]);

  if (!videoId) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8 text-muted-foreground text-sm">
        <p>Could not resolve YouTube video ID from this citation.</p>
        {citation.url && (
          <a
            href={citation.url}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          >
            Open on YouTube
          </a>
        )}
      </div>
    );
  }

  const embedUrl = buildEmbedUrl(videoId, start);

  return (
    <div className="flex flex-col">
      {/* Embedded YouTube player starting at citation timestamp */}
      <div className="relative aspect-video bg-black">
        <iframe
          ref={iframeRef}
          key={`${videoId}-${start}`}
          src={embedUrl}
          title="YouTube video player"
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      {/* Transcript excerpt */}
      <div className="p-4">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Transcript
        </div>
        <ul className="space-y-3">
          <li className="flex gap-3">
            <span className="mt-0.5 w-12 shrink-0 font-mono text-xs text-muted-foreground">
              {fmt(citation.startTime)}
            </span>
            <p className="text-[14px] leading-relaxed text-foreground">
              <span className="highlight-mark">{citation.excerpt ?? citation.snippet}</span>
            </p>
          </li>
        </ul>

        {(citation.startTime != null || citation.endTime != null) && (
          <div className="mt-3 text-[11px] text-muted-foreground font-mono">
            {fmt(citation.startTime)} – {fmt(citation.endTime)}
          </div>
        )}
      </div>
    </div>
  );
}

function buildEmbedUrl(videoId: string, startSeconds: number): string {
  // autoplay=1 + start=N makes it begin playing immediately at the timestamp
  return `https://www.youtube.com/embed/${videoId}?start=${startSeconds}&autoplay=1&rel=0`;
}
