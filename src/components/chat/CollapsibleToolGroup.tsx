import type { ChatAction, ContentBlock, ParsedToolResult } from "@/lib/types";
import { parseToolResult } from "@/lib/parsers";
import { ItemCardGrid } from "../cards/ItemCardGrid";
import { findPrecedingToolName } from "@/lib/content-blocks";
import type { SharedProductSelection } from "../cards/ProductGrid";

export interface PrecomputedToolResult {
  parsed: ParsedToolResult;
  toolName: string;
}

function dedupeProducts<T extends { name: string; brand?: string; quantity?: string; price?: number; mrp?: number }>(items: T[]): T[] {
  const seen = new Set<string>();
  const deduped: T[] = [];

  for (const item of items) {
    const key = [
      item.name.toLowerCase().trim(),
      (item.brand || "").toLowerCase().trim(),
      (item.quantity || "").toLowerCase().trim(),
      item.price ?? "",
      item.mrp ?? "",
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

export function CollapsibleToolGroup({
  blocks,
  allBlocks,
  verticalId,
  onAction,
  sharedSelection,
  precomputedResults,
}: {
  blocks: { block: ContentBlock; index: number }[];
  allBlocks: ContentBlock[];
  verticalId: string;
  onAction?: (action: ChatAction) => void;
  sharedSelection?: SharedProductSelection;
  precomputedResults?: Map<number, PrecomputedToolResult>;
}) {
  const toolUseById = new Map<string, Extract<ContentBlock, { type: "mcp_tool_use" }>>();
  for (const block of allBlocks) {
    if (block.type === "mcp_tool_use") {
      toolUseById.set(block.id, block);
    }
  }

  // Extract card results — use precomputed results when available, fall back to parsing
  const cardResults: { key: number; parsed: ReturnType<typeof parseToolResult>; toolName: string }[] = [];
  for (const { block, index } of blocks) {
    if (block.type === "mcp_tool_result") {
      const precomputed = precomputedResults?.get(index);
      if (precomputed) {
        console.log("[CollapsibleToolGroup] Parsed card:", {
          index,
          type: precomputed.parsed.type,
          toolName: precomputed.toolName,
        });
        cardResults.push({ key: index, parsed: precomputed.parsed, toolName: precomputed.toolName });
      } else {
        const matchedToolUse = toolUseById.get(block.tool_use_id);
        const toolName = matchedToolUse?.name || findPrecedingToolName(allBlocks, index);
        const parsed = parseToolResult(
          toolName,
          block.content,
          verticalId,
          matchedToolUse?.input,
        );
        console.log("[CollapsibleToolGroup] Parsed card:", {
          index,
          type: parsed.type,
          toolName,
        });
        if (parsed.type !== "raw") {
          cardResults.push({ key: index, parsed, toolName });
        }
      }
    }
  }

  if (cardResults.length === 0) return null;

  const shouldMergeProductRails = verticalId === "food" || verticalId === "style";
  let resolvedCardResults = cardResults;
  if (shouldMergeProductRails) {
    const productResults = cardResults.filter((entry) => entry.parsed.type === "products");
    if (productResults.length > 1) {
      const mergedItems = dedupeProducts(
        productResults.flatMap((entry) => entry.parsed.type === "products" ? entry.parsed.items : []),
      );
      const firstProductKey = Math.min(...productResults.map((entry) => entry.key));
      const nonProducts = cardResults.filter((entry) => entry.parsed.type !== "products");
      resolvedCardResults = [
        ...nonProducts,
        {
          key: firstProductKey,
          parsed: { type: "products" as const, items: mergedItems },
          toolName: productResults[0].toolName,
        },
      ].sort((a, b) => a.key - b.key);
    }
  }

  return (
    <div className="space-y-1">
      {resolvedCardResults.map(({ key, parsed }) =>
        onAction ? (
          <ItemCardGrid
            key={key}
            result={parsed}
            onAction={onAction}
            verticalId={verticalId}
            sharedSelection={sharedSelection}
          />
        ) : null,
      )}
    </div>
  );
}
