import { useState } from "react";
import { Bot, ChevronRight } from "lucide-react";
import type { ChatAction, ChatMessage, ContentBlock } from "@/lib/types";
import { renderMarkdownLite } from "@/lib/markdown";
import { findPrecedingToolName, groupBlocks } from "@/lib/content-blocks";
import { parseToolResult, parseVariantsFromText } from "@/lib/parsers";
import { TEXT_COLLAPSE_THRESHOLD } from "@/lib/constants";
import { ProductGrid } from "../cards/ProductGrid";
import { CollapsibleText } from "./CollapsibleText";
import { CollapsibleToolGroup } from "./CollapsibleToolGroup";
import { DetailSheet } from "./DetailSheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AssistantMessageBubble({
  message,
  onAction,
  verticalId,
}: {
  message: ChatMessage;
  onAction?: (action: ChatAction) => void;
  verticalId?: string;
}) {
  const blocks: ContentBlock[] =
    typeof message.content === "string"
      ? [{ type: "text" as const, text: message.content }]
      : message.content;

  const hasCards = blocks.some((block) => {
    if (block.type !== "mcp_tool_result") return false;
    const tn = findPrecedingToolName(blocks, blocks.indexOf(block));
    const parsed = parseToolResult(tn, block.content, verticalId ?? "");
    return parsed.type !== "raw";
  });

  const segments = groupBlocks(blocks);

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
  const resolvedVerticalId = verticalId ?? "";

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
        />
      )}
    </div>
  );
}
