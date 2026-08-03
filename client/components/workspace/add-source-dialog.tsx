import { useState } from "react";
import { UploadCloud, Link2, FileText, Video, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SourceType } from "@/lib/types";
import { useParams } from "next/navigation";
import { useUploadSource, useRegisterUrlSource } from "@/hooks/use-sources";
import { Loader2 } from "lucide-react";

function detectUrlKind(u: string): "youtube" | "website" | null {
  if (!u.trim()) return null;
  try {
    const url = new URL(u.startsWith("http") ? u : `https://${u}`);
    if (
      url.hostname.includes("youtube.com") ||
      url.hostname.includes("youtu.be")
    )
      return "youtube";
    return "website";
  } catch {
    return null;
  }
}

function inferFileType(name: string): SourceType {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "pdf";
  if (n.endsWith(".md") || n.endsWith(".markdown")) return "markdown";
  if (n.endsWith(".vtt")) return "vtt";
  if (n.endsWith(".srt")) return "srt";
  return "text";
}

export function AddSourceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { workspaceId } = useParams() as { workspaceId: string };
  const uploadMutation = useUploadSource(workspaceId);
  const registerUrlMutation = useRegisterUrlSource(workspaceId);

  const [url, setUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const urlKind = detectUrlKind(url);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // Upload all files one by one
    for (let i = 0; i < files.length; i++) {
      await uploadMutation.mutateAsync(files[i]);
    }
    
    onOpenChange(false);
  };

  const handleAddUrl = async () => {
    if (!urlKind) return;
    
    await registerUrlMutation.mutateAsync({
      url,
      type: urlKind,
      name: url,
    });
    setUrl("");
    onOpenChange(false);
  };
  
  const isPending = uploadMutation.isPending || registerUrlMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add source</DialogTitle>
          <DialogDescription>
            Upload documents or paste a link. Groundwork will parse and index the
            content in the background.
          </DialogDescription>
        </DialogHeader>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center transition",
            dragging
              ? "border-foreground/50 bg-accent/60"
              : "border-border-strong hover:bg-accent/40",
          )}
        >
          <div className="grid h-10 w-10 place-items-center rounded-full bg-surface text-muted-foreground">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium">Drop files here</div>
            <div className="mt-1 text-xs text-muted-foreground">
              or click to browse — PDF, TXT, MD, VTT, SRT
            </div>
          </div>
          <input
            type="file"
            multiple
            accept=".pdf,.txt,.md,.markdown,.vtt,.srt"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>

        <div className="my-1 flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-2">
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a website or YouTube URL"
              className="pl-9"
              onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {urlKind === "youtube" && (
                <><Video className="h-3.5 w-3.5" /> Detected YouTube video</>
              )}
              {urlKind === "website" && (
                <><Globe className="h-3.5 w-3.5" /> Detected website</>
              )}
              {!urlKind && url && <>Enter a valid URL</>}
            </div>
            <Button disabled={!urlKind} onClick={handleAddUrl} size="sm">
              Add link
            </Button>
          </div>
        </div>

        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-50 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
