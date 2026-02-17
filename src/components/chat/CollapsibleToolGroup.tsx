import type { ChatAction, ContentBlock, ParsedToolResult, RelevanceDebugTrace, ToolRenderContext } from "@/lib/types";
import { parseToolResult } from "@/lib/parsers";
import { ItemCardGrid } from "../cards/ItemCardGrid";
import { findPrecedingToolName } from "@/lib/content-blocks";
import { logger } from "@/lib/logger";
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
  renderContext,
}: {
  blocks: { block: ContentBlock; index: number }[];
  allBlocks: ContentBlock[];
  verticalId: string;
  onAction?: (action: ChatAction) => void;
  sharedSelection?: SharedProductSelection;
  precomputedResults?: Map<number, PrecomputedToolResult>;
  renderContext?: ToolRenderContext;
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
        logger.debug("[CollapsibleToolGroup] Parsed card", {
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
          renderContext,
        );
        logger.debug("[CollapsibleToolGroup] Parsed card", {
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

  const debugTraces = cardResults
    .map((entry) => entry.parsed.debug)
    .filter((trace): trace is RelevanceDebugTrace => Boolean(trace));

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
      {renderContext?.debug && debugTraces.length > 0 && (
        <div className="rounded-md border border-dashed border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[10px] text-amber-700">
          {debugTraces.map((trace, index) => (
            <div key={`${trace.strategy}-${index}`} className="truncate">
              {trace.strategy}: {trace.beforeCount ?? "-"}→{trace.afterCount ?? "-"}
              {trace.strictApplied && trace.strictApplied.length > 0 ? ` | strict=${trace.strictApplied.join(",")}` : ""}
              {trace.note ? ` | ${trace.note}` : ""}
            </div>
          ))}
        </div>
      )}
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
