import type { Citation } from "@/lib/types";

export function WebsiteViewer({ citation }: { citation: Citation }) {
  return (
    <article className="mx-auto max-w-[620px] px-6 py-8 font-serif text-[16px] leading-[1.8] text-foreground">
      <div className="mb-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Reader view · {citation.url?.replace(/^https?:\/\//, "").split("/")[0] || citation.sourceName}
      </div>
      {citation.heading && (
        <h2 className="mt-8 font-serif text-xl tracking-tight mb-4">
          {citation.heading}
        </h2>
      )}
      <p className="mt-3">
        <span className="highlight-mark">{citation.excerpt ?? citation.snippet}</span>
      </p>
    </article>
  );
}
