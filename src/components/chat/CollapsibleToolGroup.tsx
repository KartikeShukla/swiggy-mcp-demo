import type { ChatAction, ContentBlock } from "@/lib/types";
import { parseToolResult } from "@/lib/parsers";
import { ItemCardGrid } from "../cards/ItemCardGrid";
import { findPrecedingToolName } from "@/lib/content-blocks";

export function CollapsibleToolGroup({
  blocks,
  allBlocks,
  verticalId,
  onAction,
}: {
  blocks: { block: ContentBlock; index: number }[];
  allBlocks: ContentBlock[];
  verticalId: string;
  onAction?: (action: ChatAction) => void;
}) {
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

  if (cardResults.length === 0) return null;

  return (
    <div className="space-y-1">
      {cardResults.map(({ key, parsed }) =>
        onAction ? (
          <ItemCardGrid key={key} result={parsed} onAction={onAction} verticalId={verticalId} />
        ) : null,
      )}
    </div>
  );
}
