import type { Citation } from "@/lib/types";

function fmt(t?: number) {
  if (t == null) return "--:--";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TranscriptViewer({ citation }: { citation: Citation }) {
  const start = citation.startTime ?? 0;
  return (
    <div className="p-5">
      <ul className="space-y-4">
          <li className="grid grid-cols-[64px_1fr] gap-3">
            <span className="pt-0.5 font-mono text-xs text-muted-foreground">
              {fmt(start)}
            </span>
            <p className="text-[15px] leading-relaxed">
                <span className="highlight-mark">{citation.excerpt ?? citation.snippet}</span>
            </p>
          </li>
      </ul>
    </div>
  );
}
