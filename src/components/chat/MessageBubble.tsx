import { Bot, User } from "lucide-react";
import type { ChatMessage, ContentBlock } from "@/lib/types";
import { ToolTrace } from "./ToolTrace";

function renderMarkdownLite(text: string) {
  // Minimal markdown: **bold**, newlines as <br>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Split on newlines for line breaks
    return part.split("\n").map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 && <br />}
      </span>
    ));
  });
}

export function MessageBubble({
  message,
  accentColor,
}: {
  message: ChatMessage;
  accentColor: string;
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
          if (
            block.type === "mcp_tool_use" ||
            block.type === "mcp_tool_result"
          ) {
            return <ToolTrace key={i} block={block} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}
