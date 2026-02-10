import { findPrecedingToolName, groupBlocks } from "@/lib/content-blocks";
import type { ContentBlock, TextBlock, McpToolUseBlock, McpToolResultBlock } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  helpers                                                            */
/* ------------------------------------------------------------------ */

function textBlock(text: string): TextBlock {
  return { type: "text", text };
}

function toolUseBlock(name: string, id = "tu-1"): McpToolUseBlock {
  return { type: "mcp_tool_use", id, name };
}

function toolResultBlock(toolUseId = "tu-1"): McpToolResultBlock {
  return { type: "mcp_tool_result", tool_use_id: toolUseId, content: "ok" };
}

/* ------------------------------------------------------------------ */
/*  findPrecedingToolName                                              */
/* ------------------------------------------------------------------ */

describe("findPrecedingToolName", () => {
  it("returns the name of the nearest preceding mcp_tool_use block", () => {
    const blocks: ContentBlock[] = [
      toolUseBlock("search_products", "tu-1"),
      toolResultBlock("tu-1"),
    ];
    expect(findPrecedingToolName(blocks, 1)).toBe("search_products");
  });

  it("returns empty string when there is no preceding tool_use", () => {
    const blocks: ContentBlock[] = [
      textBlock("hello"),
      toolResultBlock("tu-1"),
    ];
    expect(findPrecedingToolName(blocks, 1)).toBe("");
  });

  it("skips text blocks and finds the nearest tool_use", () => {
    const blocks: ContentBlock[] = [
      toolUseBlock("add_to_cart", "tu-1"),
      textBlock("processing..."),
      toolResultBlock("tu-1"),
    ];
    expect(findPrecedingToolName(blocks, 2)).toBe("add_to_cart");
  });

  it("returns the closest tool_use, not an earlier one", () => {
    const blocks: ContentBlock[] = [
      toolUseBlock("search_products", "tu-1"),
      toolResultBlock("tu-1"),
      toolUseBlock("get_cart", "tu-2"),
      toolResultBlock("tu-2"),
    ];
    expect(findPrecedingToolName(blocks, 3)).toBe("get_cart");
  });

  it("returns empty string when index is 0", () => {
    const blocks: ContentBlock[] = [toolResultBlock("tu-1")];
    expect(findPrecedingToolName(blocks, 0)).toBe("");
  });

  it("returns empty string for an empty blocks array", () => {
    expect(findPrecedingToolName([], 0)).toBe("");
  });
});

/* ------------------------------------------------------------------ */
/*  groupBlocks                                                        */
/* ------------------------------------------------------------------ */

describe("groupBlocks", () => {
  it("returns an empty array for empty input", () => {
    expect(groupBlocks([])).toEqual([]);
  });

  it("groups consecutive tool_use and tool_result blocks into a tool_group", () => {
    const blocks: ContentBlock[] = [
      toolUseBlock("search", "tu-1"),
      toolResultBlock("tu-1"),
    ];
    const segments = groupBlocks(blocks);
    expect(segments).toHaveLength(1);
    expect(segments[0].kind).toBe("tool_group");
    if (segments[0].kind === "tool_group") {
      expect(segments[0].blocks).toHaveLength(2);
    }
  });

  it("keeps text blocks as separate text segments", () => {
    const blocks: ContentBlock[] = [
      textBlock("hello"),
      textBlock("world"),
    ];
    const segments = groupBlocks(blocks);
    expect(segments).toHaveLength(2);
    expect(segments[0].kind).toBe("text");
    expect(segments[1].kind).toBe("text");
  });

  it("separates text and tool groups correctly for mixed blocks", () => {
    const blocks: ContentBlock[] = [
      textBlock("Let me search for you"),
      toolUseBlock("search_products", "tu-1"),
      toolResultBlock("tu-1"),
      textBlock("Here are the results"),
    ];
    const segments = groupBlocks(blocks);
    expect(segments).toHaveLength(3);
    expect(segments[0].kind).toBe("text");
    expect(segments[1].kind).toBe("tool_group");
    expect(segments[2].kind).toBe("text");

    if (segments[0].kind === "text") {
      expect(segments[0].block.type).toBe("text");
      expect(segments[0].index).toBe(0);
    }
    if (segments[1].kind === "tool_group") {
      expect(segments[1].blocks).toHaveLength(2);
      expect(segments[1].blocks[0].index).toBe(1);
      expect(segments[1].blocks[1].index).toBe(2);
    }
    if (segments[2].kind === "text") {
      expect(segments[2].index).toBe(3);
    }
  });

  it("creates separate tool_groups when they are separated by text", () => {
    const blocks: ContentBlock[] = [
      toolUseBlock("search", "tu-1"),
      toolResultBlock("tu-1"),
      textBlock("Now adding to cart"),
      toolUseBlock("add_to_cart", "tu-2"),
      toolResultBlock("tu-2"),
    ];
    const segments = groupBlocks(blocks);
    expect(segments).toHaveLength(3);
    expect(segments[0].kind).toBe("tool_group");
    expect(segments[1].kind).toBe("text");
    expect(segments[2].kind).toBe("tool_group");
  });

  it("merges consecutive tool blocks into one group (multiple tool calls)", () => {
    const blocks: ContentBlock[] = [
      toolUseBlock("search", "tu-1"),
      toolResultBlock("tu-1"),
      toolUseBlock("get_details", "tu-2"),
      toolResultBlock("tu-2"),
    ];
    const segments = groupBlocks(blocks);
    expect(segments).toHaveLength(1);
    expect(segments[0].kind).toBe("tool_group");
    if (segments[0].kind === "tool_group") {
      expect(segments[0].blocks).toHaveLength(4);
    }
  });

  it("preserves correct indices in segments", () => {
    const blocks: ContentBlock[] = [
      textBlock("intro"),
      toolUseBlock("search", "tu-1"),
      toolResultBlock("tu-1"),
    ];
    const segments = groupBlocks(blocks);
    if (segments[0].kind === "text") {
      expect(segments[0].index).toBe(0);
    }
    if (segments[1].kind === "tool_group") {
      expect(segments[1].blocks[0].index).toBe(1);
      expect(segments[1].blocks[1].index).toBe(2);
    }
  });
});
