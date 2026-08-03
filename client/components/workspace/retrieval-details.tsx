import { X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RetrievalDetails } from "@/lib/types";
import { useWorkspace } from "./workspace-context";

export function RetrievalDetailsPanel({
  details,
  onClose,
}: {
  details: RetrievalDetails;
  onClose: () => void;
}) {
  const { selectCitation } = useWorkspace();
  const s = details.strategies;
  const strategies: Array<[string, boolean]> = [
    ["Rewrite", s.rewrite],
    ["Hybrid retrieval", s.hybrid],
    ["Reranking", s.rerank],
    ["Step-back", s.stepBack],
    ["HyDE", s.hyde],
    ["Decomposition", s.decomposition],
  ];

  return (
    <div className="flex h-full flex-col bg-surface">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <div className="text-sm font-medium">Retrieval details</div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <Info className="h-3 w-3" />
            Demo values — will be populated from real backend metrics.
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto p-4">
        <Section title="Query strategy">
          <div className="grid grid-cols-2 gap-1.5">
            {strategies.map(([label, active]) => (
              <div
                key={label}
                className={
                  active
                    ? "flex items-center gap-2 rounded-md border border-border-strong bg-highlight/30 px-2.5 py-1.5 text-xs text-foreground"
                    : "flex items-center gap-2 rounded-md border border-border bg-background/50 px-2.5 py-1.5 text-xs text-muted-foreground"
                }
              >
                <span
                  className={
                    active
                      ? "grid h-3.5 w-3.5 place-items-center rounded-full bg-foreground text-[9px] text-background"
                      : "h-3.5 w-3.5 rounded-full border border-border-strong"
                  }
                >
                  {active ? "✓" : ""}
                </span>
                {label}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Query">
          <FieldRow label="Original">
            <span className="font-mono text-xs">{details.originalQuery}</span>
          </FieldRow>
          <FieldRow label="Rewritten">
            <span className="font-mono text-xs">{details.rewrittenQuery}</span>
          </FieldRow>
        </Section>

        <Section title="Retrieval">
          <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              Candidates{" "}
              <span className="font-mono text-foreground">
                {details.candidatesConsidered}
              </span>
            </span>
            <span>
              Selected{" "}
              <span className="font-mono text-foreground">
                {details.candidatesSelected}
              </span>
            </span>
          </div>
          <ul className="space-y-2">
            {details.chunks.map((c, i) => (
              <li key={c.citationId}>
                <button
                  onClick={() => selectCitation(c.citationId)}
                  className="group block w-full rounded-md border border-border bg-background/60 p-3 text-left transition hover:border-border-strong"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        #{i + 1}
                      </div>
                      <div className="mt-0.5 text-sm font-medium">
                        {c.sourceName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {c.locator}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[11px]">
                      <span className="text-muted-foreground">Similarity</span>
                      <span className="text-right">{c.similarity.toFixed(2)}</span>
                      <span className="text-muted-foreground">Rerank</span>
                      <span className="text-right">{c.rerank.toFixed(2)}</span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Evaluation">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Metric label="Groundedness" value={`${details.evaluation.groundedness}/10`} />
            <Metric label="Relevance" value={`${details.evaluation.relevance}/10`} />
            <Metric label="Completeness" value={`${details.evaluation.completeness}/10`} />
            <Metric label="Retrieval attempts" value={String(details.evaluation.attempts)} />
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-background/60 p-3 [&+&]:mt-1.5">
      <div className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/60 p-2.5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono text-sm">{value}</div>
    </div>
  );
}
