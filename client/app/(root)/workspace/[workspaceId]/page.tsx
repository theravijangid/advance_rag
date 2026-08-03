"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useRef } from "react";
import { ChevronLeft, Menu, PanelRightOpen, X, FlaskConical } from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/app-logo";
import { type ChatMessage, type Source } from "@/lib/types";
import { useWorkspace as useWorkspaceQuery } from "@/hooks/use-workspaces";
import {
  WorkspaceProvider,
  useWorkspace,
} from "@/components/workspace/workspace-context";
import { SourcesPanel } from "@/components/workspace/sources-panel";
import { AddSourceDialog } from "@/components/workspace/add-source-dialog";
import { ResearchView } from "@/components/workspace/research-view";
import { SourcePanel } from "@/components/workspace/source-panel";
import { RetrievalDetailsPanel } from "@/components/workspace/retrieval-details";
import { extractAnnotation } from "@/lib/utils";

export default function WorkspacePage() {
  return (
    <WorkspaceProvider>
      <WorkspaceScreen />
    </WorkspaceProvider>
  );
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const listener = () => setMatches(m.matches);
    listener();
    m.addEventListener("change", listener);
    return () => m.removeEventListener("change", listener);
  }, [query]);
  return matches;
}

function WorkspaceScreen() {
  const { workspaceId } = useParams() as { workspaceId: string };
  const router = useRouter();
  
  const { data: baseWorkspace, isLoading, isError } = useWorkspaceQuery(workspaceId);

  // Stabilize with useMemo so array references don't change on every render
  const sources = useMemo(() => baseWorkspace?.sources ?? [], [baseWorkspace]);
  const conversations = useMemo(() => baseWorkspace?.conversations ?? [], [baseWorkspace]);

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<any[]>([]);

  useEffect(() => {
    // Auto-select the first conversation if none is active and conversations exist
    // Guard: only run when we have no active conv and conversations first load
    if (activeConvId === null && conversations.length > 0) {
      setActiveConvId(conversations[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]); // activeConvId intentionally omitted: once set it shouldn't re-trigger

  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [sourcesCollapsed, setSourcesCollapsed] = useState(false);
  const [mobileSourcesOpen, setMobileSourcesOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isTablet = useMediaQuery("(min-width: 768px)");

  const { selectedCitationId, selectCitation, setCitationMap } = useWorkspace();
  const [showRetrieval, setShowRetrieval] = useState(false);

  // Use a ref to track the last citation map JSON so we only call setCitationMap
  // when the actual citation content changes, not on every streaming re-render.
  const lastCitationKeyRef = useRef<string>("");
  useEffect(() => {
    const allCitations: Record<string, any> = {};
    activeMessages.forEach((msg) => {
      const citationMeta = extractAnnotation(msg, "citation-metadata");
      if (citationMeta?.citations) {
        Object.assign(allCitations, citationMeta.citations);
      }
    });
    const key = Object.keys(allCitations).sort().join(',');
    if (key !== lastCitationKeyRef.current) {
      lastCitationKeyRef.current = key;
      setCitationMap(allCitations);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMessages]); // setCitationMap is stable from context, safe to omit

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <AppLogo />
          <div className="text-sm text-muted-foreground animate-pulse">Loading workspace...</div>
        </div>
      </div>
    );
  }

  if (isError || !baseWorkspace) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <div className="text-lg font-medium">Workspace not found</div>
        <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  const handleNewConversation = () => {
    setActiveConvId(null);
    setActiveMessages([]);
    selectCitation(null);
  };

  const showSourcePanel = selectedCitationId !== null && !showRetrieval;
  const showRightPanel = showSourcePanel || showRetrieval;

  const lastAssistantMessage = [...activeMessages].reverse().find(m => m.role === "assistant");
  const routingDecision = extractAnnotation(lastAssistantMessage, "routing-decision")?.decision;
  const correctiveHistory = extractAnnotation(lastAssistantMessage, "corrective-history")?.history;

  const activeMessage = lastAssistantMessage ? {
    ...lastAssistantMessage,
    retrieval: {
      strategies: {
        rewrite: routingDecision?.needsRewrite ?? false,
        hybrid: true,
        rerank: true,
        stepBack: false,
        hyde: false,
        decomposition: false,
      },
      time: 840,
      totalChunks: 120,
      topK: 15,
      evals: {
        relevance: 0.88,
        faithfulness: 0.92,
      },
      attempts: correctiveHistory?.length ?? 1,
    }
  } : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-surface px-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
        >
          <Link href="/dashboard">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Workspaces</span>
          </Link>
        </Button>
        <div className="h-5 w-px bg-border" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{baseWorkspace.name}</div>
        </div>
        {!isTablet && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSourcesOpen(true)}
            className="h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
        <div className="hidden sm:block">
          <AppLogo showText={false} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {isTablet && (
          <SourcesPanel
            sources={sources}
            conversations={conversations}
            activeConversationId={activeConvId}
            onSelectConversation={(id) => {
              setActiveConvId(id);
              selectCitation(null);
              setShowRetrieval(false);
            }}
            onNewConversation={handleNewConversation}
            onAddSource={() => setAddSourceOpen(true)}
            collapsed={sourcesCollapsed}
            onToggleCollapse={() => setSourcesCollapsed((v) => !v)}
          />
        )}

        <div className="flex min-w-0 flex-1">
          {isDesktop ? (
            <ResizablePanelGroup orientation="horizontal">
              <ResizablePanel defaultSize={showRightPanel ? "58%" : "100%"} minSize="30%">
                <ResearchView
                  conversationId={activeConvId}
                  sources={sources}
                  onAddSource={() => setAddSourceOpen(true)}
                  onMessagesChange={setActiveMessages}
                />
              </ResizablePanel>
              {showRightPanel && (
                <>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize="42%" minSize="28%" maxSize="60%">
                    {showRetrieval && activeMessage?.retrieval ? (
                      <RetrievalDetailsPanel
                        details={activeMessage.retrieval}
                        onClose={() => setShowRetrieval(false)}
                      />
                    ) : (
                      <SourcePanel />
                    )}
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          ) : (
            <>
              <div className="flex min-w-0 flex-1 flex-col">
                <ResearchView
                  conversationId={activeConvId}
                  sources={sources}
                  onAddSource={() => setAddSourceOpen(true)}
                  onMessagesChange={setActiveMessages}
                />
              </div>
              {/* Mobile/tablet right panel as sheet */}
              <Sheet
                open={showRightPanel}
                onOpenChange={(o) => {
                  if (!o) {
                    selectCitation(null);
                    setShowRetrieval(false);
                  }
                }}
              >
                <SheetContent
                  side="right"
                  className="w-full max-w-full p-0 sm:max-w-lg"
                >
                  <SheetTitle className="sr-only">Source panel</SheetTitle>
                  {showRetrieval && activeMessage?.retrieval ? (
                    <RetrievalDetailsPanel
                      details={activeMessage.retrieval}
                      onClose={() => setShowRetrieval(false)}
                    />
                  ) : (
                    <SourcePanel />
                  )}
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>

      {/* Mobile sources drawer */}
      <Sheet open={mobileSourcesOpen} onOpenChange={setMobileSourcesOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetTitle className="sr-only">Sources</SheetTitle>
          <SourcesPanel
            sources={sources}
            conversations={conversations}
            activeConversationId={activeConvId}
            onSelectConversation={(id) => {
              setActiveConvId(id);
              setMobileSourcesOpen(false);
              selectCitation(null);
              setShowRetrieval(false);
            }}
            onNewConversation={() => {
              handleNewConversation();
              setMobileSourcesOpen(false);
            }}
            onAddSource={() => {
              setMobileSourcesOpen(false);
              setAddSourceOpen(true);
            }}
            collapsed={false}
            onToggleCollapse={() => setMobileSourcesOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <AddSourceDialog
        open={addSourceOpen}
        onOpenChange={setAddSourceOpen}
      />
    </div>
  );
}
