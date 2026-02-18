import { useState, useMemo } from "react";
import { Bot, ChevronRight } from "lucide-react";
import type {
  ChatAction,
  ChatMessage,
  ContentBlock,
  ParsedToolResult,
  ToolRenderContext,
} from "@/lib/types";
import { renderMarkdownLite } from "@/lib/markdown";
import { findPrecedingToolName, groupBlocks } from "@/lib/content-blocks";
import { parseToolResult, parseVariantsFromText } from "@/lib/parsers";
import { TEXT_COLLAPSE_THRESHOLD } from "@/lib/constants";
import { ProductGrid } from "../cards/ProductGrid";
import type { SharedProductSelection } from "../cards/ProductGrid";
import { CollapsibleText } from "./CollapsibleText";
import { CollapsibleToolGroup } from "./CollapsibleToolGroup";
import type { PrecomputedToolResult } from "./CollapsibleToolGroup";
import { DetailSheet } from "./DetailSheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function buildDiningGroundedSummary(cardResultTypes: ParsedToolResult["type"][]): string | null {
  const hasType = (type: ParsedToolResult["type"]) => cardResultTypes.includes(type);

  if (hasType("booking_confirmed")) {
    return "Booking confirmed. Review the booking details below.";
  }
  if (hasType("time_slots")) {
    return "Here are the available time slots.";
  }
  if (hasType("restaurants")) {
    return "Here are restaurant options that best match your request.";
  }
  if (hasType("info")) {
    return "Here are the latest dining filters and next-step suggestions.";
  }
  if (hasType("status")) {
    return "Here is the latest booking status update.";
  }

  return null;
}

export function AssistantMessageBubble({
  message,
  onAction,
  verticalId,
  renderContext,
  sharedSelection,
}: {
  message: ChatMessage;
  onAction?: (action: ChatAction) => void;
  verticalId?: string;
  renderContext?: ToolRenderContext;
  sharedSelection?: SharedProductSelection;
}) {
  const blocks: ContentBlock[] = useMemo(
    () =>
      typeof message.content === "string"
        ? [{ type: "text" as const, text: message.content }]
        : message.content,
    [message.content],
  );

  const resolvedVerticalId = verticalId ?? "";

  const { hasCards, segments, precomputedResults, cardResultTypes } = useMemo(() => {
    const segs = groupBlocks(blocks);
    const resultsMap = new Map<number, PrecomputedToolResult>();
    let cards = false;
    const parsedTypeSet = new Set<ParsedToolResult["type"]>();
    const toolUseById = new Map<string, Extract<ContentBlock, { type: "mcp_tool_use" }>>();

    for (const block of blocks) {
      if (block.type === "mcp_tool_use") {
        toolUseById.set(block.id, block);
      }
    }

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (block.type !== "mcp_tool_result") continue;
      const matchedToolUse = toolUseById.get(block.tool_use_id);
      const tn = matchedToolUse?.name || findPrecedingToolName(blocks, i);
      const parsed = parseToolResult(
        tn,
        block.content,
        resolvedVerticalId,
        matchedToolUse?.input,
        renderContext,
      );
      if (parsed.type !== "raw") {
        cards = true;
        parsedTypeSet.add(parsed.type);
        resultsMap.set(i, { parsed, toolName: tn });
      }
    }

    return {
      hasCards: cards,
      segments: segs,
      precomputedResults: resultsMap,
      cardResultTypes: [...parsedTypeSet],
    };
  }, [blocks, resolvedVerticalId, renderContext]);
  const diningGroundedSummary = useMemo(() => {
    if (resolvedVerticalId !== "dining" || !hasCards) return null;
    return buildDiningGroundedSummary(cardResultTypes);
  }, [cardResultTypes, hasCards, resolvedVerticalId]);

  const collapsibleTexts: string[] = [];
  if (hasCards) {
    for (const segment of segments) {
      if (
        segment.kind === "text" &&
        segment.block.type === "text" &&
        segment.block.text &&
        segment.block.text.length > TEXT_COLLAPSE_THRESHOLD
      ) {
        collapsibleTexts.push(segment.block.text);
      }
    }
  }
  const collapsibleText = collapsibleTexts.join("\n\n");
  const detailBlocks = segments.flatMap((segment) => (
    segment.kind === "tool_group" ? segment.blocks : []
  ));
  const hasDetails = detailBlocks.length > 0;
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const firstTextSegmentIndex = useMemo(
    () =>
      segments.findIndex(
        (segment) =>
          segment.kind === "text" &&
          segment.block.type === "text" &&
          Boolean(segment.block.text),
      ),
    [segments],
  );

  return (
    <div className="flex flex-col items-start gap-3 px-3 py-2 animate-[fade-in_200ms_ease-out]">
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Avatar className="h-5 w-5 shrink-0">
            <AvatarFallback className="bg-primary/10 text-[10px]">
              <Bot className="h-3 w-3 text-primary" />
            </AvatarFallback>
          </Avatar>
          <span className="text-[10px] text-muted-foreground">Assistant</span>
        </div>
        {hasDetails && (
          <button
            type="button"
            onClick={() => setDetailSheetOpen(true)}
            className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            aria-label="See Details"
          >
            See Details
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="min-w-0 w-full space-y-2">
        {segments.map((segment, si) => {
          if (
            segment.kind === "text" &&
            segment.block.type === "text" &&
            segment.block.text
          ) {
            if (diningGroundedSummary) {
              if (si !== firstTextSegmentIndex) return null;
              return (
                <CollapsibleText
                  key={si}
                  text={diningGroundedSummary}
                  hasCards={false}
                />
              );
            }

            const parsed = parseVariantsFromText(segment.block.text);
            const hasProductSegments = parsed.segments.some(
              (s) => s.type === "products",
            );

            if (!hasProductSegments) {
              return (
                <CollapsibleText
                  key={si}
                  text={segment.block.text}
                  hasCards={hasCards}
                />
              );
            }

            return (
              <div key={si} className="space-y-2">
                {parsed.segments.map((seg, segi) => {
                  if (seg.type === "text") {
                    return (
                      <div
                        key={segi}
                        className="rounded-2xl rounded-bl-md bg-card px-4 py-2.5 text-sm text-card-foreground leading-relaxed shadow-sm ring-1 ring-border"
                      >
                        {renderMarkdownLite(seg.content)}
                      </div>
                    );
                  }
                  if (seg.type === "products" && onAction) {
                    return (
                      <ProductGrid
                        key={segi}
                        items={seg.items}
                        onAction={onAction}
                        verticalId={resolvedVerticalId}
                        sharedSelection={sharedSelection}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            );
          }

          if (segment.kind === "tool_group") {
            return (
              <CollapsibleToolGroup
                key={si}
                blocks={segment.blocks}
                allBlocks={blocks}
                verticalId={resolvedVerticalId}
                onAction={onAction}
                sharedSelection={sharedSelection}
                precomputedResults={precomputedResults}
                renderContext={renderContext}
              />
            );
          }

          return null;
        })}
      </div>
      {hasDetails && (
        <DetailSheet
          open={detailSheetOpen}
          onOpenChange={setDetailSheetOpen}
          text={collapsibleText}
          blocks={detailBlocks}
          allBlocks={blocks}
          verticalId={resolvedVerticalId}
          renderContext={renderContext}
        />
      )}
    </div>
  );
}
