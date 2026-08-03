import { useMemo } from "react";
import { X, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SourceTypeIcon } from "@/components/app-logo";
import { Settings } from "lucide-react";
import type { Citation } from "@/lib/types";
import { useWorkspace } from "./workspace-context";
import { PDFViewer } from "./viewers/pdf-viewer";
import { YouTubeViewer } from "./viewers/youtube-viewer";
import { WebsiteViewer } from "./viewers/website-viewer";
import { TranscriptViewer } from "./viewers/transcript-viewer";
import { TextViewer } from "./viewers/text-viewer";

export function SourcePanel() {
  const { selectedCitationId, selectCitation, getCitation, developerMode, setDeveloperMode } = useWorkspace();
  const citation = selectedCitationId ? getCitation(selectedCitationId) : null;

  if (!citation) return null;

  const locator = getLocator(citation);

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden border-l border-border bg-surface">
      <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground">
            <SourceTypeIcon type={citation.sourceType} className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{citation.sourceName}</div>
            <div className="truncate text-xs text-muted-foreground">{locator}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {citation.url && (() => {
            let externalUrl = citation.url;
            // For YouTube citations, append &t=Xs so the tab opens at the right timestamp
            if (citation.sourceType === "youtube" && citation.startTime != null) {
              const start = Math.floor(citation.startTime);
              try {
                const u = new URL(citation.url);
                u.searchParams.set("t", `${start}s`);
                externalUrl = u.toString();
              } catch {
                externalUrl = `${citation.url}&t=${start}s`;
              }
            }
            return (
              <Button variant="ghost" size="sm" asChild>
                <a href={externalUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </a>
              </Button>
            );
          })()}
          <Button
            variant={developerMode ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setDeveloperMode(!developerMode)}
            aria-label="Toggle Developer Mode"
            className="h-8 w-8"
            title="Toggle Retrieval Details"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => selectCitation(null)}
            aria-label="Close source panel"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="scrollbar-thin flex-1 overflow-y-auto relative">
        {developerMode && (citation.score !== undefined || citation.denseRank !== undefined) && (
          <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 rounded-md bg-secondary/95 px-3 py-2 text-xs font-mono text-secondary-foreground shadow-sm backdrop-blur">
            {/* <div className="font-semibold mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Dense Retrieval</div> */}
            <div className="flex gap-2">
              {/* {citation.denseRank !== undefined && <span>Rank #{citation.denseRank}</span>} */}
              {citation.score !== undefined && <span>Score: {citation.score.toFixed(3)}</span>}
            </div>
            {citation.rerankScore !== undefined && (
              <>
                <div className="font-semibold mt-1 mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Cross-Encoder</div>
                <div className="flex gap-2">
                  {citation.rerankRank !== undefined && <span>Rank #{citation.rerankRank}</span>}
                  {citation.rerankScore !== undefined && <span>Score: {citation.rerankScore.toFixed(3)}</span>}
                </div>
              </>
            )}
          </div>
        )}
        <ViewerRouter citation={citation} />
      </div>
    </aside>
  );
}

function getLocator(c: Citation) {
  if (c.sourceType === "pdf") return c.page ? `Page ${c.page}` : "Document";
  if (c.sourceType === "youtube" || c.sourceType === "vtt" || c.sourceType === "srt") {
    return `${fmt(c.startTime)} – ${fmt(c.endTime)}`;
  }
  if (c.sourceType === "markdown" && c.headingPath && c.headingPath.length > 0) {
    return c.headingPath.join(" > ");
  }
  if (c.heading) return c.heading;
  return "";
}

function fmt(t?: number) {
  if (t == null) return "--:--";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function ViewerRouter({ citation }: { citation: Citation }) {
  switch (citation.sourceType) {
    case "pdf":
      return <PDFViewer citation={citation} />;
    case "youtube":
      return <YouTubeViewer citation={citation} />;
    case "website":
      return <WebsiteViewer citation={citation} />;
    case "vtt":
    case "srt":
      return <TranscriptViewer citation={citation} />;
    case "markdown":
    case "text":
    default:
      return <TextViewer citation={citation} />;
  }
}
