import { cn } from "@/lib/utils";
import { useWorkspace } from "./workspace-context";

export function CitationChip({
  citationId,
  label,
}: {
  citationId: string;
  label: number;
}) {
  const { selectedCitationId, selectCitation } = useWorkspace();
  const active = selectedCitationId === citationId;
  return (
    <button
      type="button"
      aria-label={`Open source for citation ${label}`}
      onClick={() => selectCitation(citationId)}
      className={cn(
        "citation-chip",
        active && "citation-chip-active",
        "hover:border-foreground/60 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {label}
    </button>
  );
}
