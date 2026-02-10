import { renderMarkdownLite } from "@/lib/markdown";
import { TEXT_COLLAPSE_THRESHOLD } from "@/lib/constants";

export function CollapsibleText({
  text,
  hasCards,
}: {
  text: string;
  hasCards: boolean;
}) {
  const shouldCollapse = hasCards && text.length > TEXT_COLLAPSE_THRESHOLD;

  // When collapsible, render nothing — text is shown in the DetailSheet via the tool group chip
  if (shouldCollapse) {
    return null;
  }

  return (
    <div className="rounded-2xl rounded-bl-md bg-card px-4 py-2.5 text-sm text-card-foreground leading-relaxed shadow-sm ring-1 ring-border">
      {renderMarkdownLite(text)}
    </div>
  );
}
