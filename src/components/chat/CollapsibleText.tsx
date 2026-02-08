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
      <div className="rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-sm text-gray-800 leading-relaxed shadow-sm ring-1 ring-gray-100">
        {renderMarkdownLite(text)}
      </div>
    );
  }

  return (
    <div className="rounded-2xl rounded-bl-md bg-white shadow-sm ring-1 ring-gray-100">
      {expanded && (
        <div className="px-4 pt-2.5 pb-1 text-sm text-gray-800 leading-relaxed">
          {renderMarkdownLite(text)}
        </div>
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-center gap-1 px-4 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
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
