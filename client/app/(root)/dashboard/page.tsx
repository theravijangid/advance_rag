"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search, MessageSquare, FileStack } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserButton } from "@clerk/nextjs";
import { type Workspace } from "@/lib/types";
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog";
import { useWorkspaces, useCreateWorkspace } from "@/hooks/use-workspaces";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const { data: workspaces = [], isLoading } = useWorkspaces();
  const createWorkspace = useCreateWorkspace();

  const filtered = workspaces.filter((w) =>
    w.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
          <Link href="/"><AppLogo /></Link>
          <div className="relative ml-4 hidden max-w-sm flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search workspaces…"
              className="pl-9"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button onClick={() => setOpen(true)} size="sm">
              <Plus className="h-4 w-4" />
              New workspace
            </Button>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Workspaces
          </h1>
          <div className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${filtered.length} total`}
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-surface">
              <FileStack className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium">No workspaces found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {q
                ? "Try adjusting your search query."
                : "Create a workspace to start researching."}
            </p>
            {!q && (
              <Button onClick={() => setOpen(true)} className="mt-6">
                <Plus className="mr-2 h-4 w-4" />
                Create workspace
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() => setOpen(true)}
              className="group flex min-h-[168px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-transparent text-sm text-muted-foreground transition hover:border-foreground/40 hover:text-foreground"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface transition group-hover:border-foreground/40">
                <Plus className="h-4 w-4" />
              </span>
              New workspace
            </button>
            {filtered.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
          </div>
        )}
      </div>

      <CreateWorkspaceDialog
        open={open}
        onOpenChange={setOpen}
        onCreate={(name, description) => {
          createWorkspace.mutate(
            { name, description },
            {
              onSuccess: () => {
                setOpen(false);
              },
            }
          );
        }}
      />
    </div>
  );
}

function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  return (
    <Link
      href={`/workspace/${workspace.id}`}
      className="group relative flex min-h-[168px] flex-col justify-between rounded-xl border border-border bg-card p-5 transition hover:border-border-strong hover:shadow-sm"
    >
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-highlight" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Workspace
          </span>
        </div>
        <h3 className="text-[15px] font-semibold leading-snug tracking-tight">
          {workspace.name}
        </h3>
        {workspace.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
            {workspace.description}
          </p>
        )}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-y-2 gap-x-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <FileStack className="h-3.5 w-3.5 shrink-0" />
            {workspace.sources.length} sources
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            {workspace.conversations.length} conversations
          </span>
        </div>
        <span className="whitespace-nowrap">Updated {workspace.updatedAt ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(workspace.updatedAt)) : ''}</span>
      </div>
    </Link>
  );
}
