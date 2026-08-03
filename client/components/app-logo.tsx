import { cn } from "@/lib/utils";

export function AppLogo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path
            d="M5 5h9a5 5 0 0 1 0 10H8v4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="18" cy="18" r="2" fill="currentColor" />
        </svg>
      </div>
      {showText && (
        <span className="text-[15px] font-semibold tracking-tight">
          Groundwork
        </span>
      )}
    </div>
  );
}

/* Small icon per source type */
export function SourceTypeIcon({
  type,
  className,
}: {
  type: import("@/lib/types").SourceType;
  className?: string;
}) {
  const base = cn("h-3.5 w-3.5 shrink-0", className);
  switch (type) {
    case "pdf":
      return (
        <svg viewBox="0 0 16 16" className={base} fill="none">
          <path
            d="M4 2h5l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path d="M9 2v3h3" stroke="currentColor" strokeWidth="1.2" />
          <text
            x="8"
            y="12"
            textAnchor="middle"
            fontSize="4"
            fontWeight="700"
            fill="currentColor"
          >
            PDF
          </text>
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 16 16" className={base} fill="none">
          <rect
            x="1.5"
            y="3.5"
            width="13"
            height="9"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path d="M7 6.5v3l2.5-1.5L7 6.5Z" fill="currentColor" />
        </svg>
      );
    case "website":
      return (
        <svg viewBox="0 0 16 16" className={base} fill="none">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.2" />
          <path
            d="M2.5 8h11M8 2.5c1.8 2 1.8 9 0 11M8 2.5c-1.8 2-1.8 9 0 11"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      );
    case "vtt":
    case "srt":
      return (
        <svg viewBox="0 0 16 16" className={base} fill="none">
          <rect
            x="2"
            y="3"
            width="12"
            height="10"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M4.5 10h2M8 10h3.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "markdown":
      return (
        <svg viewBox="0 0 16 16" className={base} fill="none">
          <rect
            x="1.5"
            y="3.5"
            width="13"
            height="9"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M4 10V6l1.5 2L7 6v4M10 6v4m0 0-1-1m1 1 1-1"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 16 16" className={base} fill="none">
          <path
            d="M4 2h5l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path d="M9 2v3h3M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
  }
}
