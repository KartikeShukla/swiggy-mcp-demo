import type { ContentBlock } from "./types";

export type DisplaySegment =
  | { kind: "text"; block: ContentBlock; index: number }
  | { kind: "tool_group"; blocks: { block: ContentBlock; index: number }[] };

/** Walk backwards from `index` to find the nearest mcp_tool_use block's name. */
export function findPrecedingToolName(blocks: ContentBlock[], index: number): string {
  for (let i = index - 1; i >= 0; i--) {
    const block = blocks[i];
    if (block.type === "mcp_tool_use") {
      return block.name;
    }
  }
  return "";
}

/** Group consecutive tool_use/tool_result blocks into tool groups, keeping text blocks separate. */
export function groupBlocks(blocks: ContentBlock[]): DisplaySegment[] {
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
