import {
  sanitizeAssistantBlocks,
  sanitizeMessagesForApi,
} from "@/integrations/anthropic/message-sanitizer";
import type { ChatMessage, ContentBlock } from "@/lib/types";

describe("message-sanitizer", () => {
  describe("sanitizeAssistantBlocks", () => {
    it("removes orphan tool uses and orphan tool results", () => {
      const blocks: ContentBlock[] = [
        { type: "text", text: "before" },
        { type: "mcp_tool_use", id: "u-1", name: "search_products" },
        { type: "mcp_tool_use", id: "u-orphan", name: "search_products" },
        {
          type: "mcp_tool_result",
          tool_use_id: "u-1",
          content: [{ type: "text", text: "ok" }],
        },
        {
          type: "mcp_tool_result",
          tool_use_id: "u-missing",
          content: [{ type: "text", text: "orphan" }],
        },
      ];

      const result = sanitizeAssistantBlocks(blocks);

      expect(result.blocks).toEqual([
        { type: "text", text: "before" },
        { type: "mcp_tool_use", id: "u-1", name: "search_products" },
        {
          type: "mcp_tool_result",
          tool_use_id: "u-1",
          content: [{ type: "text", text: "ok" }],
        },
      ]);
      expect(result.droppedBlocksCount).toBe(2);
    });

    it("drops tool blocks with empty ids", () => {
      const blocks: ContentBlock[] = [
        { type: "mcp_tool_use", id: "", name: "search" },
        { type: "mcp_tool_result", tool_use_id: "", content: "x" },
        { type: "text", text: "kept" },
      ];

      const result = sanitizeAssistantBlocks(blocks);

      expect(result.blocks).toEqual([{ type: "text", text: "kept" }]);
      expect(result.droppedBlocksCount).toBe(2);
    });

    it("keeps matched duplicate tool-use/result pairs in order", () => {
      const blocks: ContentBlock[] = [
        { type: "mcp_tool_use", id: "u-1", name: "search" },
        { type: "mcp_tool_result", tool_use_id: "u-1", content: "a" },
        { type: "mcp_tool_use", id: "u-1", name: "search" },
        { type: "mcp_tool_result", tool_use_id: "u-1", content: "b" },
      ];

      const result = sanitizeAssistantBlocks(blocks);
      expect(result.blocks).toEqual(blocks);
      expect(result.droppedBlocksCount).toBe(0);
    });
  });

  describe("sanitizeMessagesForApi", () => {
    function user(content: string): ChatMessage {
      return { role: "user", content, timestamp: Date.now() };
    }

    function assistant(content: string | ContentBlock[]): ChatMessage {
      return { role: "assistant", content, timestamp: Date.now() };
    }

    it("sanitizes only assistant block messages and preserves others", () => {
      const history: ChatMessage[] = [
        user("hello"),
        assistant("plain text"),
        assistant([
          { type: "text", text: "x" },
          { type: "mcp_tool_result", tool_use_id: "missing", content: "oops" },
        ]),
      ];

      const result = sanitizeMessagesForApi(history);

      expect(result.sanitizedMessages).toHaveLength(3);
      expect(result.sanitizedMessages[0]).toEqual(history[0]);
      expect(result.sanitizedMessages[1]).toEqual(history[1]);
      expect(result.sanitizedMessages[2]).toEqual(
        expect.objectContaining({
          role: "assistant",
          content: [{ type: "text", text: "x" }],
        }),
      );
      expect(result.droppedBlocksCount).toBe(1);
    });
  });
});
