import { useState } from "react";
import { ChevronRight, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentBlock } from "@/lib/types";

export function ToolTrace({
  block,
  defaultCollapsed = false,
}: {
  block: ContentBlock;
  defaultCollapsed?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (block.type === "mcp_tool_use") {
    return (
      <div className="my-1.5">
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
        >
          <Wrench className="h-3 w-3" />
          <span className="font-medium">{block.name}</span>
          <ChevronRight
            className={cn(
              "h-3 w-3 transition-transform",
              open && "rotate-90",
            )}
          />
        </button>
        {open && (
          <pre className="mt-1 max-h-60 overflow-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground font-mono">
            {JSON.stringify(block.input, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  if (block.type === "mcp_tool_result") {
    return (
      <div className="my-1.5">
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors",
            block.is_error
              ? "bg-destructive/10 text-destructive hover:bg-destructive/15"
              : "bg-primary/10 text-primary hover:bg-primary/15",
          )}
        >
          <span className="font-medium">
            {block.is_error ? "Error" : defaultCollapsed ? "Show raw data" : "Result"}
          </span>
          <ChevronRight
            className={cn(
              "h-3 w-3 transition-transform",
              open && "rotate-90",
            )}
          />
        </button>
        {open && (
          <pre className="mt-1 max-h-60 overflow-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground font-mono">
            {typeof block.content === "string"
              ? block.content
              : JSON.stringify(block.content, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  return null;
}
