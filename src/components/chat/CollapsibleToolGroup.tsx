import { useState } from "react";
import { ChevronRight, Wrench } from "lucide-react";
import type { ContentBlock } from "@/lib/types";
import { parseToolResult } from "@/lib/parsers";
import { Badge } from "@/components/ui/badge";
import { ItemCardGrid } from "../cards/ItemCardGrid";
import { DetailSheet } from "./DetailSheet";
import { findPrecedingToolName } from "@/lib/content-blocks";

export function CollapsibleToolGroup({
  blocks,
  allBlocks,
  verticalId,
  onAction,
  collapsibleText = "",
}: {
  blocks: { block: ContentBlock; index: number }[];
  allBlocks: ContentBlock[];
  verticalId: string;
  onAction?: (message: string) => void;
  collapsibleText?: string;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

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

  const hasMessage = collapsibleText.length > 0;
  const toolLabel = `${toolUseCount} tool ${toolUseCount === 1 ? "call" : "calls"}`;

  return (
    <div className="space-y-1">
      {/* Card results rendered outside collapsible */}
      {cardResults.map(({ key, parsed }) =>
        onAction ? (
          <ItemCardGrid key={key} result={parsed} onAction={onAction} verticalId={verticalId} />
        ) : null,
      )}

      {/* Combined chip */}
      <Badge
        variant="secondary"
        className="cursor-pointer gap-1.5 rounded-full"
        onClick={() => setSheetOpen(true)}
        aria-label={hasMessage ? `${toolLabel} and message` : toolLabel}
      >
        <Wrench className="h-3 w-3" />
        <span>
          {toolLabel}
          {hasMessage && <> · message</>}
        </span>
        <ChevronRight className="h-3 w-3" />
      </Badge>

      {/* Bottom sheet with tabs */}
      <DetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        text={collapsibleText}
        blocks={blocks}
        allBlocks={allBlocks}
        verticalId={verticalId}
      />
    </div>
  );
}
