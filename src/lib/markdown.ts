import type { ReactNode } from "react";
import { createElement } from "react";

/** Render a subset of Markdown (headings, lists, bold, code) as React elements. */
export function renderMarkdownLite(text: string): ReactNode[] {
  // Split into lines first for block-level rendering
  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let listItems: { type: "ul" | "ol"; items: ReactNode[] } | null = null;

  const flushList = () => {
    if (!listItems) return;
    if (listItems.type === "ul") {
      elements.push(
        createElement("ul", { key: `list-${elements.length}`, className: "my-1 ml-4 list-disc space-y-0.5" },
          listItems.items.map((item, i) =>
            createElement("li", { key: i, className: "text-sm" }, item)
          )
        )
      );
    } else {
      elements.push(
        createElement("ol", { key: `list-${elements.length}`, className: "my-1 ml-4 list-decimal space-y-0.5" },
          listItems.items.map((item, i) =>
            createElement("li", { key: i, className: "text-sm" }, item)
          )
        )
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
        createElement("div", { key: `h-${i}`, className: `${cls} text-foreground mt-1` },
          renderInline(headingMatch[2])
        )
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
        elements.push(createElement("br", { key: `br-${i}` }));
      }
      continue;
    }

    // Regular line
    elements.push(
      createElement("span", { key: `l-${i}` },
        ...renderInline(line),
        ...(i < lines.length - 1 && lines[i + 1]?.trim() !== "" ? [createElement("br", { key: `lbr-${i}` })] : [])
      )
    );
  }

  flushList();
  return elements;
}

/** Render inline markdown (**bold**, `code`) as React elements. */
export function renderInline(text: string): ReactNode[] {
  // Handle **bold**, `code`, and plain text
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return createElement("strong", { key: i, className: "font-semibold" }, part.slice(2, -2));
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return createElement("code", { key: i, className: "rounded bg-muted px-1 py-0.5 text-xs font-mono text-muted-foreground" }, part.slice(1, -1));
    }
    return createElement("span", { key: i }, part);
  });
}
