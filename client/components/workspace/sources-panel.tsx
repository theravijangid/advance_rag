import { useState } from "react";
import { Plus, MoreHorizontal, AlertTriangle, RotateCcw, Trash2, ChevronsLeft, ChevronsRight, MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SourceTypeIcon } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import type { Source, SourceStatus, Conversation } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useParams } from "next/navigation";
import { useDeleteSource, useRetrySource } from "@/hooks/use-sources";

const STATUS_LABEL: Record<SourceStatus, string> = {
  UPLOADING: "Uploading",
  QUEUED: "Queued",
  PARSING: "Parsing",
  CHUNKING: "Chunking",
  EMBEDDING: "Embedding",
  READY: "Ready",
  FAILED: "Failed",
};

function StatusDot({ status }: { status: SourceStatus }) {
  if (status === "READY")
    return <span className="h-1.5 w-1.5 rounded-full bg-success" />;
  if (status === "FAILED")
    return <AlertTriangle className="h-3 w-3 text-destructive" />;
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-60" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-warning" />
    </span>
  );
}

export function SourcesPanel({
  sources,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onAddSource,
  collapsed,
  onToggleCollapse,
}: {
  sources: Source[];
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onAddSource: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  if (collapsed) {
    return (
      <div className="flex h-full w-12 shrink-0 flex-col items-center gap-2 border-r border-border bg-sidebar py-3">
        <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="h-8 w-8">
          <ChevronsRight className="h-4 w-4" />
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onAddSource} className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Add source</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-sidebar">
      {/* Sources header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Sources
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" onClick={onAddSource} className="h-7 w-7">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="h-7 w-7">
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="px-3 pb-2">
        <button
          onClick={onAddSource}
          className="flex w-full items-center gap-2 rounded-md border border-dashed border-border-strong bg-transparent px-3 py-2 text-sm text-muted-foreground transition hover:border-foreground/40 hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Add source
        </button>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-4">
        <ul className="space-y-0.5">
          {sources.map((s) => (
            <SourceRow key={s.id} source={s} />
          ))}
          {sources.length === 0 && (
            <li className="px-3 py-6 text-center text-xs text-muted-foreground">
              No sources yet.
            </li>
          )}
        </ul>

        {/* Conversations */}
        <div className="mt-6 flex items-center justify-between px-2">
          <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Conversations
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewConversation}
            className="h-6 w-6"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <ul className="mt-2 space-y-0.5">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => onSelectConversation(c.id)}
                className={cn(
                  "flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-1.5 text-left text-sm transition",
                  activeConversationId === c.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <span className="truncate leading-tight">{c.title}</span>
                <span className="text-[10px] text-muted-foreground">
                  {c.updatedAt ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(c.updatedAt)) : ''}
                </span>
              </button>
            </li>
          ))}
          {conversations.length === 0 && (
            <li className="px-3 py-2 text-xs text-muted-foreground">
              No conversations yet.
            </li>
          )}
        </ul>
      </div>
    </aside>
  );
}

function SourceRow({ source }: { source: Source }) {
  const [open, setOpen] = useState(false);
  const { workspaceId } = useParams() as { workspaceId: string };
  const deleteMutation = useDeleteSource(workspaceId);
  const retryMutation = useRetrySource(workspaceId);

  const failed = source.status === "FAILED";
  const inFlight = source.status !== "READY" && source.status !== "FAILED";
  return (
    <li
      className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-sidebar-accent/60"
      onMouseEnter={() => setOpen(false)}
    >
      <SourceTypeIcon
        type={source.type}
        className={cn(
          "text-muted-foreground",
          failed && "text-destructive",
        )}
      />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "truncate",
            failed ? "text-destructive" : "text-foreground",
          )}
          title={source.name}
        >
          {source.name}
        </div>
        {(inFlight || failed) && (
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <StatusDot status={source.status} />
            <span>{STATUS_LABEL[source.status]}</span>
          </div>
        )}
      </div>
      {source.status === "READY" && (
        <StatusDot status="READY" />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded p-0.5 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-accent hover:text-foreground">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {failed && (
            <DropdownMenuItem
              onClick={() => retryMutation.mutate(source.id)}
              disabled={retryMutation.isPending}
            >
              <RotateCcw className="h-3.5 w-3.5" /> 
              {retryMutation.isPending ? "Retrying..." : "Retry"}
            </DropdownMenuItem>
          )}
          {failed && (
            <DropdownMenuItem>View error</DropdownMenuItem>
          )}
          <DropdownMenuItem 
            className="text-destructive focus:text-destructive"
            onClick={() => deleteMutation.mutate(source.id)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-3.5 w-3.5" /> 
            {deleteMutation.isPending ? "Removing..." : "Remove"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
