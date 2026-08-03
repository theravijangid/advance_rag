import { useState, useRef, useEffect } from "react";
import { ArrowUp, StopCircle, ChevronDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ChatComposer({
  onSend,
  status,
  onStop,
}: {
  onSend: (text: string) => void;
  status: "idle" | "thinking" | "streaming";
  onStop?: () => void;
}) {
  const [text, setText] = useState("");
  const [scope, setScope] = useState("All sources");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${Math.min(ref.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  const submit = () => {
    if (!text.trim() || status !== "idle") return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div
        className={cn(
          "rounded-2xl border border-border bg-surface shadow-sm transition-colors focus-within:border-border-strong",
        )}
      >
        <Textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Ask anything about your sources…"
          className="min-h-[52px] resize-none border-0 bg-transparent px-4 py-3.5 text-[15px] leading-relaxed shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-between gap-2 px-2 pb-2">
          <div></div>
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                {scope}
                <ChevronDown className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {["All sources", "PDFs only", "Videos only", "Websites only"].map((s) => (
                <DropdownMenuItem key={s} onSelect={() => setScope(s)}>
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu> */}
          <div className="flex items-center gap-2">
            {status !== "idle" && onStop && (
              <Button variant="ghost" size="sm" onClick={onStop}>
                <StopCircle className="h-4 w-4" /> Stop
              </Button>
            )}
            <Button
              onClick={submit}
              disabled={!text.trim() || status !== "idle"}
              size="icon"
              className="h-8 w-8 rounded-full"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Groundwork answers only from your sources. Every claim is citable.
      </p>
    </div>
  );
}
