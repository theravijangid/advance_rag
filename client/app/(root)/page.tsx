import Link from "next/link";
import { ArrowRight, Layers, Search, Sparkles, ShieldCheck } from "lucide-react";
import { AppLogo, SourceTypeIcon } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export const metadata = {
  title: "Groundwork — Grounded AI research across your sources",
  description: "Research across documents, websites and videos with answers grounded in your sources.",
};

export default async function Landing() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <AppLogo />
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#explain" className="hover:text-foreground">Explainability</a>
        </nav>
        <div className="flex items-center gap-2">
          {!userId ? (
            <Link
              href="/sign-in"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              Sign in
            </Link>
          ) : (
            <UserButton />
          )}
          <Button asChild size="sm">
            <Link href="/dashboard">Start Researching</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Adaptive · Grounded · Explainable
          </div>
          <h1 className="font-serif text-5xl leading-[1.05] tracking-tight md:text-6xl">
            Research across documents, websites and videos —{" "}
            <span className="italic text-muted-foreground">
              with answers grounded in your sources.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Upload your research material, ask complex questions, and inspect the
            exact evidence behind every answer. Every claim traces back to the
            passage, page, or timestamp it came from.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Start Researching
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            {/* <Button asChild size="lg" variant="outline">
              <Link href="/workspace/w1">
                View demo
              </Link>
            </Button> */}
          </div>
        </div>

        {/* Product preview */}
        <ProductPreview />
      </section>

      {/* Sources supported */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-16">
        <SectionHeader
          eyebrow="Multi-source"
          title="Bring every kind of research material"
          subtitle="Groundwork indexes what you already read, watch and reference."
        />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {[
            { t: "pdf" as const, l: "PDF" },
            { t: "website" as const, l: "Websites" },
            { t: "youtube" as const, l: "YouTube" },
            { t: "vtt" as const, l: "Transcripts" },
            { t: "markdown" as const, l: "Markdown" },
          ].map((s) => (
            <div
              key={s.l}
              className="flex flex-col items-start gap-2 rounded-lg border border-border bg-surface p-4"
            >
              <SourceTypeIcon type={s.t} className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">{s.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <FeatureCard
            icon={<Layers className="h-4 w-4" />}
            title="Grounded answers with clickable citations"
            body="Every claim links to the passage, page or timestamp it came from. No decorative citations."
          >
            <div className="rounded-md border border-border bg-surface p-4 text-sm leading-relaxed">
              SQS provides durable message buffering and lets workers process
              independently.{" "}
              <span className="citation-chip citation-chip-active">1</span>
              <br />
              The queue absorbs spikes without overwhelming downstream services.{" "}
              <span className="citation-chip">2</span>
            </div>
          </FeatureCard>

          <FeatureCard
            icon={<Search className="h-4 w-4" />}
            title="Inspect every source"
            body="Clicking a citation opens the original evidence in a side panel — the exact page, paragraph, or moment in a video."
          >
            <div className="rounded-md border border-border bg-surface p-3 font-mono text-xs">
              <div className="mb-2 flex items-center justify-between text-muted-foreground">
                <span>architecture.pdf</span>
                <span>Page 18</span>
              </div>
              <p className="font-sans text-sm text-foreground">
                <span className="highlight-mark">
                  The architecture uses SQS as a durable buffer
                </span>{" "}
                between the ingestion API and the worker pool…
              </p>
            </div>
          </FeatureCard>

          <FeatureCard
            icon={<Sparkles className="h-4 w-4" />}
            title="Adaptive retrieval"
            body="The system chooses retrieval strategies based on the question — rewriting, hybrid search, reranking — only when they help."
          >
            <div className="flex flex-wrap gap-1.5 text-xs">
              {["Rewrite", "Hybrid", "Rerank"].map((s) => (
                <span
                  key={s}
                  className="rounded-md border border-border-strong bg-highlight/40 px-2 py-0.5 text-highlight-foreground"
                >
                  ✓ {s}
                </span>
              ))}
              {["Step-back", "HyDE", "Decomposition"].map((s) => (
                <span
                  key={s}
                  className="rounded-md border border-border bg-surface px-2 py-0.5 text-muted-foreground"
                >
                  ○ {s}
                </span>
              ))}
            </div>
          </FeatureCard>

          <FeatureCard
            icon={<ShieldCheck className="h-4 w-4" />}
            title="Explainable by design"
            body="Optional developer view shows how retrieval ran, what was ranked, and how the answer scored."
          >
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              {[
                ["Groundedness", "9/10"],
                ["Relevance", "9/10"],
                ["Completeness", "8/10"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-md border border-border bg-surface p-2">
                  <div className="text-muted-foreground">{k}</div>
                  <div className="mt-1 text-foreground">{v}</div>
                </div>
              ))}
            </div>
          </FeatureCard>
        </div>
      </section>

      {/* CTA */}
      <section id="explain" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-2xl border border-border bg-surface p-10 text-center md:p-14">
          <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
            Every answer, verifiable.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Build a workspace, drop in your sources, and start asking real questions.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard">Start Researching</Link>
            </Button>
          </div>
        </div>
        <footer className="mt-10 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <AppLogo showText={false} />
            <span>© {new Date().getFullYear()} Groundwork</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
          </div>
        </footer>
      </section>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {eyebrow}
      </div>
      <h2 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">{title}</h2>
      <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="grid h-7 w-7 place-items-center rounded-md border border-border bg-surface">
          {icon}
        </span>
        <span className="font-mono text-xs uppercase tracking-widest">Feature</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto mt-14 max-w-5xl">
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_1px_0_0_rgba(0,0,0,0.03),0_20px_60px_-30px_rgba(0,0,0,0.25)]">
        {/* window bar */}
        <div className="flex items-center gap-1.5 border-b border-border bg-surface-2 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="ml-3 font-mono text-[11px] text-muted-foreground">
            groundwork · Distributed Backend Architecture
          </span>
        </div>
        <div className="grid grid-cols-12 min-h-[380px]">
          {/* Sources */}
          <aside className="col-span-3 border-r border-border p-4 text-xs">
            <div className="mb-3 flex items-center justify-between text-muted-foreground">
              <span className="font-medium text-foreground">Sources</span>
              <span>+</span>
            </div>
            <ul className="space-y-1.5">
              {[
                { t: "pdf" as const, n: "architecture.pdf" },
                { t: "pdf" as const, n: "database-design.pdf" },
                { t: "youtube" as const, n: "System Design Lecture" },
                { t: "website" as const, n: "Backend Architecture Guide" },
                { t: "vtt" as const, n: "system-design.vtt" },
              ].map((s) => (
                <li
                  key={s.n}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-foreground hover:bg-accent"
                >
                  <SourceTypeIcon type={s.t} className="text-muted-foreground" />
                  <span className="truncate">{s.n}</span>
                </li>
              ))}
            </ul>
          </aside>

          {/* Chat */}
          <main className="col-span-6 border-r border-border p-5 text-sm">
            <div className="mb-4 flex justify-end">
              <div className="rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground">
                Why did the author recommend SQS instead of Lambda?
              </div>
            </div>
            <div className="space-y-2 leading-relaxed">
              <p>
                SQS was recommended primarily because it provides durable message
                buffering and lets workers process independently.{" "}
                <span className="citation-chip citation-chip-active">1</span>
              </p>
              <p>
                The design also needed to absorb temporary processing spikes
                without overwhelming downstream services.{" "}
                <span className="citation-chip">2</span>
              </p>
              <p>
                Lambda's execution model introduced tradeoffs around long-running
                processing for this workload.{" "}
                <span className="citation-chip">3</span>
              </p>
            </div>
          </main>

          {/* Source panel */}
          <section className="col-span-3 p-4 text-xs">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="font-medium text-foreground">architecture.pdf</div>
                <div className="text-muted-foreground">Page 18</div>
              </div>
              <span className="text-muted-foreground">×</span>
            </div>
            <div className="rounded-md border border-border bg-background p-3 font-serif text-[13px] leading-relaxed">
              …the ingestion API places work on a queue.{" "}
              <span className="highlight-mark">
                The architecture uses SQS as a durable buffer between the
                ingestion API and the worker pool
              </span>
              , decoupling request rate from processing capacity.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
