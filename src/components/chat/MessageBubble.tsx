import { useState } from "react";
import { Bot, User, ChevronDown, ChevronUp, ChevronRight, Wrench } from "lucide-react";
import type { ChatMessage, ContentBlock } from "@/lib/types";
import { ToolTrace } from "./ToolTrace";
import { ItemCardGrid } from "../cards/ItemCardGrid";
import { ProductGrid } from "../cards/ItemCardGrid";
import { parseToolResult, parseVariantsFromText } from "@/lib/parsers";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

function renderMarkdownLite(text: string): ReactNode[] {
  // Split into lines first for block-level rendering
  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let listItems: { type: "ul" | "ol"; items: ReactNode[] } | null = null;

  const flushList = () => {
    if (!listItems) return;
    if (listItems.type === "ul") {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-1 ml-4 list-disc space-y-0.5">
          {listItems.items.map((item, i) => (
            <li key={i} className="text-sm">{item}</li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`list-${elements.length}`} className="my-1 ml-4 list-decimal space-y-0.5">
          {listItems.items.map((item, i) => (
            <li key={i} className="text-sm">{item}</li>
          ))}
        </ol>
      );
    }
    listItems = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const cls = level === 1 ? "text-base font-bold" : level === 2 ? "text-sm font-bold" : "text-sm font-semibold";
      elements.push(
        <div key={`h-${i}`} className={`${cls} text-gray-900 mt-1`}>
          {renderInline(headingMatch[2])}
        </div>
      );
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^\s*[-*]\s+(.+)/);
    if (ulMatch) {
      if (!listItems || listItems.type !== "ul") {
        flushList();
        listItems = { type: "ul", items: [] };
      }
      listItems.items.push(renderInline(ulMatch[1]));
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\s*\d+\.\s+(.+)/);
    if (olMatch) {
      if (!listItems || listItems.type !== "ol") {
        flushList();
        listItems = { type: "ol", items: [] };
      }
      listItems.items.push(renderInline(olMatch[1]));
      continue;
    }

    flushList();

    // Empty line
    if (line.trim() === "") {
      if (i > 0 && i < lines.length - 1) {
        elements.push(<br key={`br-${i}`} />);
      }
      continue;
    }

    // Regular line
    elements.push(
      <span key={`l-${i}`}>
        {renderInline(line)}
        {i < lines.length - 1 && lines[i + 1]?.trim() !== "" && <br />}
      </span>
    );
  }

  flushList();
  return elements;
}

function renderInline(text: string): ReactNode[] {
  // Handle **bold**, `code`, and plain text
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-gray-100 px-1 py-0.5 text-xs font-mono text-gray-700">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function CollapsibleText({
  text,
  hasCards,
}: {
  text: string;
  hasCards: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const shouldCollapse = hasCards && text.length > 120;

  if (!shouldCollapse) {
    return (
      <div className="rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-sm text-gray-800 leading-relaxed shadow-sm ring-1 ring-gray-100">
        {renderMarkdownLite(text)}
      </div>
    );
  }

  return (
    <div className="rounded-2xl rounded-bl-md bg-white shadow-sm ring-1 ring-gray-100">
      {expanded && (
        <div className="px-4 pt-2.5 pb-1 text-sm text-gray-800 leading-relaxed">
          {renderMarkdownLite(text)}
        </div>
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-center gap-1 px-4 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        {expanded ? (
          <>
            Hide message <ChevronUp className="h-3 w-3" />
          </>
        ) : (
          <>
            Show message <ChevronDown className="h-3 w-3" />
          </>
        )}
      </button>
    </div>
  );
}

function findPrecedingToolName(blocks: ContentBlock[], index: number): string {
  for (let i = index - 1; i >= 0; i--) {
    if (blocks[i].type === "mcp_tool_use" && blocks[i].name) {
      return blocks[i].name!;
    }
  }
  return "";
}

// --- Block grouping ---

type DisplaySegment =
  | { kind: "text"; block: ContentBlock; index: number }
  | { kind: "tool_group"; blocks: { block: ContentBlock; index: number }[] };

function groupBlocks(blocks: ContentBlock[]): DisplaySegment[] {
  const segments: DisplaySegment[] = [];
  let toolGroup: { block: ContentBlock; index: number }[] | null = null;

  const flushToolGroup = () => {
    if (toolGroup && toolGroup.length > 0) {
      segments.push({ kind: "tool_group", blocks: toolGroup });
      toolGroup = null;
    }
  };

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === "mcp_tool_use" || block.type === "mcp_tool_result") {
      if (!toolGroup) toolGroup = [];
      toolGroup.push({ block, index: i });
    } else {
      flushToolGroup();
      segments.push({ kind: "text", block, index: i });
    }
  }

  flushToolGroup();
  return segments;
}

// --- Collapsible Tool Group ---

function CollapsibleToolGroup({
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
      ? [{ type: "text", text: message.content }]
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
