import type { Citation } from "@/lib/types";

export function TextViewer({ citation }: { citation: Citation }) {
  return (
    <article className="mx-auto max-w-[620px] px-6 py-8 font-serif text-[16px] leading-[1.8]">
      <h2 className="font-serif text-2xl tracking-tight">
        {citation.heading ?? citation.sourceName}
      </h2>
      <p className="mt-3">
        <span className="highlight-mark">{citation.excerpt ?? citation.snippet}</span>
      </p>
    </article>
  );
}
