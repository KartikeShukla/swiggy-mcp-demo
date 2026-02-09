import { Bot, User } from "lucide-react";
import type { ChatMessage, ContentBlock } from "@/lib/types";
import { renderMarkdownLite } from "@/lib/markdown";
import { findPrecedingToolName, groupBlocks } from "@/lib/content-blocks";
import { parseToolResult, parseVariantsFromText } from "@/lib/parsers";
import { ProductGrid } from "../cards/ItemCardGrid";
import { CollapsibleText } from "./CollapsibleText";
import { CollapsibleToolGroup } from "./CollapsibleToolGroup";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function MessageBubble({
  message,
  onAction,
  verticalId,
}: {
  message: ChatMessage;
  onAction?: (message: string) => void;
  verticalId?: string;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1 px-3 py-2 animate-[fade-in_200ms_ease-out]">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">You</span>
          <Avatar className="h-5 w-5 shrink-0">
            <AvatarFallback className="bg-muted text-[10px]">
              <User className="h-3 w-3 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="max-w-[88%] rounded-2xl rounded-br-md bg-foreground px-4 py-2.5 text-sm text-background leading-relaxed">
          {typeof message.content === "string"
            ? renderMarkdownLite(message.content)
            : null}
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
    <div className="flex flex-col items-start gap-1 px-3 py-2 animate-[fade-in_200ms_ease-out]">
      <div className="flex items-center gap-1.5">
        <Avatar className="h-5 w-5 shrink-0">
          <AvatarFallback className="bg-primary/10 text-[10px]">
            <Bot className="h-3 w-3 text-primary" />
          </AvatarFallback>
        </Avatar>
        <span className="text-[10px] text-muted-foreground">Assistant</span>
      </div>
      <div className="min-w-0 w-full space-y-2">
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
