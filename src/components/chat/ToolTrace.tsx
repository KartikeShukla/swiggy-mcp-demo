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
          className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 transition-colors"
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
          <pre className="mt-1 overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
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
              ? "bg-red-50 text-red-600 hover:bg-red-100"
              : "bg-green-50 text-green-700 hover:bg-green-100",
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
          <pre className="mt-1 max-h-60 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
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
