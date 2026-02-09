import { useState } from "react";
import type { ContentBlock } from "@/lib/types";
import { renderMarkdownLite } from "@/lib/markdown";
import { findPrecedingToolName } from "@/lib/content-blocks";
import { parseToolResult } from "@/lib/parsers";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { ToolTrace } from "./ToolTrace";

type Tab = "message" | "tools";

export function DetailSheet({
  open,
  onOpenChange,
  text,
  blocks,
  allBlocks,
  verticalId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  text: string;
  blocks: { block: ContentBlock; index: number }[];
  allBlocks: ContentBlock[];
  verticalId: string;
}) {
  const hasText = text.length > 0;
  const defaultTab: Tab = hasText ? "message" : "tools";
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const resolvedActiveTab: Tab = hasText ? activeTab : "tools";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="h-[min(72dvh,34rem)] p-0"
      >
        <SheetTitle className="sr-only">Details</SheetTitle>

        <div className="px-4 pb-2 pt-1">
          <div className="inline-flex w-full rounded-xl bg-muted/70 p-1">
            {hasText && (
              <button
                onClick={() => setActiveTab("message")}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                  resolvedActiveTab === "message"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Message
              </button>
            )}
            <button
              onClick={() => setActiveTab("tools")}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                resolvedActiveTab === "tools"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Tool Calls
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {hasText && resolvedActiveTab === "message" && (
            <div className="rounded-xl border border-border/70 bg-card p-3 text-sm leading-relaxed text-card-foreground shadow-sm">
              {renderMarkdownLite(text)}
            </div>
          )}

          {resolvedActiveTab === "tools" && (
            <div className="space-y-2">
              {blocks.map(({ block, index }) => {
                if (block.type === "mcp_tool_result") {
                  const toolName = findPrecedingToolName(allBlocks, index);
                  const parsed = parseToolResult(toolName, block.content, verticalId);
                  return (
                    <ToolTrace
                      key={index}
                      block={block}
                      defaultCollapsed={parsed.type !== "raw"}
                    />
                  );
                }
                return <ToolTrace key={index} block={block} />;
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
