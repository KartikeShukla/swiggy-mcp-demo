import { Bot, User } from "lucide-react";
import type { ChatMessage, ContentBlock } from "@/lib/types";
import { renderMarkdownLite } from "@/lib/markdown";
import { findPrecedingToolName, groupBlocks } from "@/lib/content-blocks";
import { parseToolResult, parseVariantsFromText } from "@/lib/parsers";
import { ProductGrid } from "../cards/ItemCardGrid";
import { CollapsibleText } from "./CollapsibleText";
import { CollapsibleToolGroup } from "./CollapsibleToolGroup";

export function MessageBubble({
  message,
  accentColor,
  onAction,
  verticalId,
}: {
  message: ChatMessage;
  accentColor: string;
  onAction?: (message: string) => void;
  verticalId?: string;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end gap-2 px-4 py-2">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-gray-900 px-4 py-2.5 text-sm text-white leading-relaxed">
          {typeof message.content === "string"
            ? renderMarkdownLite(message.content)
            : null}
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200">
          <User className="h-4 w-4 text-gray-600" />
        </div>
      </div>
    );
  }

  // Assistant message
  const blocks: ContentBlock[] =
    typeof message.content === "string"
      ? [{ type: "text" as const, text: message.content }]
      : message.content;

  // Pre-scan: check if any tool result renders as a card (non-raw)
  const hasCards = blocks.some((block) => {
    if (block.type !== "mcp_tool_result") return false;
    const tn = findPrecedingToolName(blocks, blocks.indexOf(block));
    const parsed = parseToolResult(tn, block.content, verticalId ?? "");
    return parsed.type !== "raw";
  });

  const segments = groupBlocks(blocks);

  return (
    <div className="flex gap-2 px-4 py-2">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `var(--color-${accentColor})20` }}
      >
        <Bot
          className="h-4 w-4"
          style={{ color: `var(--color-${accentColor})` }}
        />
      </div>
      <div className="max-w-[80%] space-y-1">
        {segments.map((segment, si) => {
          if (segment.kind === "text" && segment.block.type === "text" && segment.block.text) {
            const parsed = parseVariantsFromText(segment.block.text);
            const hasProductSegments = parsed.segments.some((s) => s.type === "products");

            if (!hasProductSegments) {
              return (
                <CollapsibleText
                  key={si}
                  text={segment.block.text}
                  hasCards={hasCards}
                />
              );
            }

            // Render mixed text + product segments
            return (
              <div key={si} className="space-y-2">
                {parsed.segments.map((seg, segi) => {
                  if (seg.type === "text") {
                    return (
                      <div
                        key={segi}
                        className="rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-sm text-gray-800 leading-relaxed shadow-sm ring-1 ring-gray-100"
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
                        accentColor={accentColor}
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
                accentColor={accentColor}
                verticalId={verticalId ?? ""}
                onAction={onAction}
              />
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
