import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { renderMarkdownLite } from "@/lib/markdown";
import { TEXT_COLLAPSE_THRESHOLD } from "@/lib/constants";

export function CollapsibleText({
  text,
  hasCards,
}: {
  text: string;
  hasCards: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const shouldCollapse = hasCards && text.length > TEXT_COLLAPSE_THRESHOLD;

  if (!shouldCollapse) {
    return (
      <div className="rounded-2xl rounded-bl-md bg-card px-4 py-2.5 text-sm text-card-foreground leading-relaxed shadow-sm ring-1 ring-border">
        {renderMarkdownLite(text)}
      </div>
    );
  }

  return (
    <div className="rounded-2xl rounded-bl-md bg-card shadow-sm ring-1 ring-border">
      {expanded && (
        <div className="px-4 pt-2.5 pb-1 text-sm text-card-foreground leading-relaxed">
          {renderMarkdownLite(text)}
        </div>
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-center gap-1 px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <>
            Hide message <ChevronUp className="h-3 w-3" />
          </>
        ) : (
          <>
            Show message <ChevronDown className="h-3 w-3" />
          </>
        )}
      </button>
    </div>
  );
}
