import { useState, useRef, useEffect } from "react";
import type { ChatMessage, Source } from "@/lib/types";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { useChatHistory } from "@/hooks/use-chat-history";
import { CitationChip } from "./citation";
import { ChatComposer } from "./chat-composer";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ArrowRight,
  ChevronsUpDown,
  Loader2,
  Plus,
  FileStack,
} from "lucide-react";
import { SourceTypeIcon } from "@/components/app-logo";
import { ChevronDown, FileText, Search, Play, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { extractAnnotation, cn } from "@/lib/utils";
import { useWorkspace } from "./workspace-context";

export function ResearchView({
  conversationId,
  sources,
  onAddSource,
  onMessagesChange,
}: {
  conversationId: string | null;
  sources: Source[];
  onAddSource: () => void;
  onMessagesChange?: (messages: ChatMessage[]) => void;
}) {
  const { workspaceId } = useParams() as { workspaceId: string };
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: history, isLoading: isHistoryLoading } = useChatHistory(workspaceId, conversationId);

  const chatHelpers = useChat({
    id: conversationId ?? "new",
    transport: new DefaultChatTransport({
      api: `${apiUrl}/api/v1/workspaces/${workspaceId}/chat`,
      body: { conversationId },
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        const token = await getToken();
        const headers = new Headers(init?.headers);
        headers.set("Authorization", `Bearer ${token}`);
        return fetch(input, {
          ...init,
          headers
        });
      },
    }),
    onFinish: () => {
      // Mark that we just finished so the history useEffect skips applying stale data
      // until the fresh refetch completes.
      justFinishedStreamingRef.current = true;
      queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId] });
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ["chat-history", workspaceId, conversationId] });
      }
    }
  } as any);

  const { messages, setMessages, sendMessage, status: chatStatus, stop, error } = chatHelpers as any;

  // Keep a ref to the callback so it never triggers the effect
  const onMessagesChangeRef = useRef(onMessagesChange);
  useEffect(() => { onMessagesChangeRef.current = onMessagesChange; });

  // When a stream finishes, onFinish invalidates the chat-history query, but the refetch
  // takes ~1s. During that window chatStatus is 'idle' and history is still stale.
  // setMessages(stale_history) would overwrite the streamed messages → user query flashes away.
  // Solution: mark that we just finished streaming; skip the first setMessages call so the
  // streamed messages stay visible, and only apply history once the fresh data arrives.
  const justFinishedStreamingRef = useRef(false);

  useEffect(() => {
    // Do NOT override messages while the AI SDK is streaming/submitting.
    if (chatStatus === 'streaming' || chatStatus === 'submitted') return;

    // Skip applying stale history immediately after a stream finishes.
    // The next time history changes (fresh refetch) this flag is already cleared.
    if (justFinishedStreamingRef.current) {
      justFinishedStreamingRef.current = false;
      return;
    }

    if (history?.messages) {
      setMessages(history.messages);
    } else if (conversationId === null) {
      setMessages([]); // Reset for new conversation
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, conversationId, chatStatus]); // setMessages is a stable setter, safe to omit

  useEffect(() => {
    // Do NOT propagate messages to parent during active streaming.
    // Citations and routing annotations only arrive at the end of the stream anyway,
    // and calling setActiveMessages on every chunk causes WorkspaceScreen (parent) to
    // re-render, which React throttles → "pause then burst" streaming appearance.
    if (chatStatus === 'streaming' || chatStatus === 'submitted') return;
    if (onMessagesChangeRef.current) {
      onMessagesChangeRef.current(messages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, chatStatus]); // onMessagesChange intentionally omitted via ref pattern

  const scrollRef = useRef<HTMLDivElement>(null);
  const readySources = sources.filter((s) => s.status === "READY");

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const handleSend = (text: string) => {
    sendMessage({
      role: 'user',
      content: text
    });
  };

  const isEmptyWorkspace = readySources.length === 0;
  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full flex-1 flex-col">
      <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-10">
          {error && (
            <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive flex gap-3 items-start">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Failed to send message</p>
                <p className="mt-1 opacity-90">
                  {error.message === 'Failed to fetch' 
                    ? 'Network error. Please try again later.' 
                    : error.message}
                </p>
              </div>
            </div>
          )}
          {isHistoryLoading && conversationId && !hasMessages ? (
            <div className="flex h-full items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Your chats are loading...</p>
              </div>
            </div>
          ) : isEmptyWorkspace && !hasMessages ? (
            <EmptyWorkspace onAddSource={onAddSource} />
          ) : !hasMessages ? (
            <ReadyEmpty onQuickAsk={handleSend} />
          ) : (
            <div className="space-y-8">
              {messages.map((m: any) => (
                <MessageView key={m.id} message={m} />
              ))}
              {(chatStatus === "submitted" || (chatStatus === "streaming" && messages.length > 0 && (() => {
                const last = messages[messages.length - 1];
                if (last?.role !== 'assistant') return false;
                const text = Array.isArray(last?.parts) 
                  ? last.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text ?? '').join('')
                  : last?.content ?? '';
                return !text;
              })())) && <ThinkingIndicator label="Searching your sources…" />}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-background/85 px-6 py-4 backdrop-blur">
        <ChatComposer
          onSend={handleSend}
          status={chatStatus === 'streaming' || chatStatus === 'submitted' ? 'thinking' : 'idle'}
          onStop={stop}
        />
      </div>
    </div>
  );
}

function MessageView({ message }: { message: any }) {
  // Extract citation metadata from annotations if available
  const citationMap = extractAnnotation(message, 'citation-metadata')?.citations;
  const routingDecision = extractAnnotation(message, 'routing-decision')?.decision;

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-primary-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  // In the new AI SDK UIMessage format, text is stored in message.parts during streaming.
  // message.content is only the final committed string (may be empty during active streaming).
  // We must read from parts to get progressive rendering.
  const content: string = (() => {
    if (Array.isArray(message.parts) && message.parts.length > 0) {
      return message.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text ?? '')
        .join('');
    }
    return message.content || '';
  })();

  // Parse content to replace [C1] with CitationChip if valid
  const renderContent = () => {
    const citationRegex = /(\[C\d+\])/g;
    const parts = content.split(citationRegex);

    return parts.map((part: string, idx: number) => {
      const match = part.match(/^\[C(\d+)\]$/);
      if (match) {
        const cId = `C${match[1]}`;
        if (citationMap && citationMap[cId]) {
          return <span key={idx} className="mx-1 inline-flex"><CitationChip citationId={cId} label={parseInt(match[1], 10)} /></span>;
        }
        // Fallback to plain text if citation is invalid/hallucinated
        return <span key={idx}>{part}</span>;
      }
      
      return <span key={idx}>{part.split("\n").map((p, i, arr) => (
        <span key={`${idx}-${i}`}>
          {p}
          {i < arr.length - 1 && <br />}
        </span>
      ))}</span>;
    });
  };

  return (
    <div className="flex gap-4">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-surface text-foreground shadow-sm">
        <div className="text-sm font-semibold">AI</div>
      </div>
      <div className="flex-1 space-y-4 pt-1">
        <div className="prose prose-sm dark:prose-invert max-w-none text-[15px] leading-relaxed text-foreground">
          {renderContent()}
        </div>
        {citationMap && Object.keys(citationMap).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-border/50">
            <span className="text-xs font-medium text-muted-foreground w-full">Citations Used:</span>
            {Object.keys(citationMap).map(cId => (
              <CitationChip key={cId} citationId={cId} label={parseInt(cId.replace('C', '')) || 1} />
            ))}
          </div>
        )}
        
        {routingDecision && (
          <div className="mt-2 flex flex-wrap gap-2 pt-2 border-t border-border/50">
            <span className="text-xs font-medium text-muted-foreground w-full">Routing Strategy:</span>
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-foreground capitalize">
                {routingDecision.complexity}
              </span>
              {routingDecision.rewrite && (
                <span className="inline-flex items-center rounded-md border border-border-strong bg-highlight/40 px-2 py-0.5 text-xs text-highlight-foreground">
                  ✓ Rewrite
                </span>
              )}
              {routingDecision.stepBack && (
                <span className="inline-flex items-center rounded-md border border-border-strong bg-highlight/40 px-2 py-0.5 text-xs text-highlight-foreground">
                  ✓ Step-Back
                </span>
              )}
              {routingDecision.decompose && (
                <span className="inline-flex items-center rounded-md border border-border-strong bg-highlight/40 px-2 py-0.5 text-xs text-highlight-foreground">
                  ✓ Decompose
                </span>
              )}
              {routingDecision.hyde && (
                <span className="inline-flex items-center rounded-md border border-border-strong bg-highlight/40 px-2 py-0.5 text-xs text-highlight-foreground">
                  ✓ HyDE
                </span>
              )}
              {(!routingDecision.rewrite && !routingDecision.stepBack && !routingDecision.decompose && !routingDecision.hyde) && (
                <span className="inline-flex items-center rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-muted-foreground">
                  Direct Retrieval (No Expansion)
                </span>
              )}
            </div>
            {routingDecision.reason && (
              <p className="text-[11px] text-muted-foreground w-full mt-0.5 italic">
                "{routingDecision.reason}"
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

function EmptyWorkspace({ onAddSource }: { onAddSource: () => void }) {
  const kinds: Array<{ t: import("@/lib/types").SourceType; l: string }> = [
    { t: "pdf", l: "PDF Docs" },
    { t: "website", l: "Webpages" },
    { t: "youtube", l: "YouTube" },
    { t: "vtt", l: "Transcripts" },
    { t: "markdown", l: "Markdown" },
  ];
  return (
    <div className="mx-auto max-w-xl py-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-border bg-surface">
        <FileStack className="h-5 w-5 text-muted-foreground" />
      </div>
      <h2 className="mt-5 font-serif text-2xl tracking-tight">
        Build your research workspace
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Add documents, websites or videos to start asking questions grounded in
        your material.
      </p>
      <Button className="mt-6" onClick={onAddSource}>
        <Plus className="h-4 w-4" />
        Add sources
      </Button>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {kinds.map((k) => (
          <span
            key={k.l}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground"
          >
            <SourceTypeIcon type={k.t} />
            {k.l}
          </span>
        ))}
      </div>
    </div>
  );
}

function ReadyEmpty({ onQuickAsk }: { onQuickAsk: (q: string) => void }) {
  const samples = [
    "Why did the author recommend SQS instead of Lambda?",
    "Summarize the queue architecture in three points.",
    "What are the scalability tradeoffs discussed?",
  ];
  return (
    <div className="py-8">
      <h2 className="font-serif text-2xl tracking-tight">Your sources are ready.</h2>
      <p className="mt-2 text-sm text-muted-foreground">Ask anything about them.</p>
      <ul className="mt-6 space-y-1.5">
        {samples.map((s) => (
          <li key={s}>
            <button
              onClick={() => onQuickAsk(s)}
              className="group flex w-full items-center justify-between rounded-md border border-border bg-surface px-4 py-3 text-left text-sm transition hover:border-border-strong"
            >
              <span>{s}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
