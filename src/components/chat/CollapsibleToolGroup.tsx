import { useState } from "react";
import { ChevronRight, Wrench } from "lucide-react";
import type { ContentBlock } from "@/lib/types";
import { findPrecedingToolName } from "@/lib/content-blocks";
import { parseToolResult } from "@/lib/parsers";
import { cn } from "@/lib/utils";
import { ToolTrace } from "./ToolTrace";
import { ItemCardGrid } from "../cards/ItemCardGrid";

export function CollapsibleToolGroup({
  blocks,
  allBlocks,
  accentColor,
  verticalId,
  onAction,
}: {
  blocks: { block: ContentBlock; index: number }[];
  allBlocks: ContentBlock[];
  accentColor: string;
  verticalId: string;
  onAction?: (message: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  // Count tool uses (not results) for the pill label
  const toolUseCount = blocks.filter((b) => b.block.type === "mcp_tool_use").length;

  // Extract card results to render outside the collapsible
  const cardResults: { key: number; parsed: ReturnType<typeof parseToolResult>; toolName: string }[] = [];
  for (const { block, index } of blocks) {
    if (block.type === "mcp_tool_result") {
      const toolName = findPrecedingToolName(allBlocks, index);
      const parsed = parseToolResult(toolName, block.content, verticalId);
      if (parsed.type !== "raw") {
        cardResults.push({ key: index, parsed, toolName });
      }
    }
  }

  return (
    <div className="space-y-1">
      {/* Card results rendered outside collapsible */}
      {cardResults.map(({ key, parsed }) =>
        onAction ? (
          <ItemCardGrid key={key} result={parsed} onAction={onAction} accentColor={accentColor} />
        ) : null,
      )}

      {/* Collapsible pill */}
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={`${toolUseCount} tool ${toolUseCount === 1 ? "call" : "calls"}`}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-gray-400 hover:text-gray-600 transition-colors",
          expanded && "text-gray-500",
        )}
      >
        <Wrench className="h-3 w-3" />
        <span>{toolUseCount} tool {toolUseCount === 1 ? "call" : "calls"}</span>
        <ChevronRight
          className={cn(
            "h-3 w-3 transition-transform",
            expanded && "rotate-90",
          )}
        />
      </button>

      {/* Expanded tool traces */}
      {expanded && (
        <div className="ml-2 space-y-1 border-l-2 border-gray-100 pl-3">
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
  );
}
