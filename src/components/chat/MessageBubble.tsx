import { Bot, User } from "lucide-react";
import type { ChatMessage, ContentBlock } from "@/lib/types";
import { ToolTrace } from "./ToolTrace";
import { ItemCardGrid } from "../cards/ItemCardGrid";
import { parseToolResult } from "@/lib/parsers";
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

function findPrecedingToolName(blocks: ContentBlock[], index: number): string {
  for (let i = index - 1; i >= 0; i--) {
    if (blocks[i].type === "mcp_tool_use" && blocks[i].name) {
      return blocks[i].name!;
    }
  }
  return "";
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
        {blocks.map((block, i) => {
          if (block.type === "text" && block.text) {
            return (
              <div
                key={i}
                className="rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-sm text-gray-800 leading-relaxed shadow-sm ring-1 ring-gray-100"
              >
                {renderMarkdownLite(block.text)}
              </div>
            );
          }
          if (block.type === "mcp_tool_use") {
            return <ToolTrace key={i} block={block} />;
          }
          if (block.type === "mcp_tool_result") {
            const toolName = findPrecedingToolName(blocks, i);
            const parsed = parseToolResult(toolName, block.content, verticalId ?? "");

            return (
              <div key={i}>
                {parsed.type !== "raw" && onAction && (
                  <ItemCardGrid result={parsed} onAction={onAction} accentColor={accentColor} />
                )}
                <ToolTrace block={block} defaultCollapsed={parsed.type !== "raw"} />
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
