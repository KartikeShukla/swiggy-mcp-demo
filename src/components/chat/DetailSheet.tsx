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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[60%] rounded-t-2xl"
      >
        <SheetTitle className="sr-only">Details</SheetTitle>

        {/* Tab bar */}
        <div className="flex gap-4 border-b border-border px-4">
          {hasText && (
            <button
              onClick={() => setActiveTab("message")}
              className={cn(
                "pb-2 text-xs font-medium transition-colors",
                activeTab === "message"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Message
            </button>
          )}
          <button
            onClick={() => setActiveTab("tools")}
            className={cn(
              "pb-2 text-xs font-medium transition-colors",
              activeTab === "tools"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Tool Calls
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-4 pb-4">
          {activeTab === "message" && hasText && (
            <div className="text-sm text-card-foreground leading-relaxed">
              {renderMarkdownLite(text)}
            </div>
          )}

          {activeTab === "tools" && (
            <div className="space-y-1">
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
