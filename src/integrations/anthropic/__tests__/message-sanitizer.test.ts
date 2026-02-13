import {
  sanitizeAssistantBlocks,
  sanitizeMessagesForApi,
  compactOldMessages,
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

  describe("compactOldMessages", () => {
    function user(content: string): ChatMessage {
      return { role: "user", content, timestamp: Date.now() };
    }

    function assistant(content: string | ContentBlock[]): ChatMessage {
      return { role: "assistant", content, timestamp: Date.now() };
    }

    it("returns messages unchanged when length <= keepRecent", () => {
      const msgs = [user("hi"), assistant("hello")];
      const result = compactOldMessages(msgs, 4);
      expect(result).toBe(msgs);
    });

    it("strips tool blocks from older assistant messages, keeping text", () => {
      const msgs: ChatMessage[] = [
        user("search"),
        assistant([
          { type: "text" as const, text: "Found items" },
          { type: "mcp_tool_use" as const, id: "u-1", name: "search" },
          { type: "mcp_tool_result" as const, tool_use_id: "u-1", content: "big data" },
        ]),
        user("next"),
        assistant("ok"),
        user("more"),
        assistant("sure"),
        user("even more"),
        assistant("yep"),
      ];

      const result = compactOldMessages(msgs, 4);

      // Older assistant message (index 1) should only have text blocks
      const oldAssistant = result[1];
      expect(Array.isArray(oldAssistant.content)).toBe(true);
      const blocks = oldAssistant.content as ContentBlock[];
      expect(blocks).toHaveLength(1);
      expect(blocks[0]).toEqual({ type: "text", text: "Found items" });
    });

    it("injects placeholder when all blocks are tool blocks", () => {
      const msgs: ChatMessage[] = [
        user("q1"),
        assistant([
          { type: "mcp_tool_use" as const, id: "u-1", name: "search" },
          { type: "mcp_tool_result" as const, tool_use_id: "u-1", content: "data" },
        ]),
        user("q2"),
        assistant("response2"),
        user("q3"),
        assistant("response3"),
      ];

      const result = compactOldMessages(msgs, 4);
      const oldBlocks = result[1].content as ContentBlock[];
      expect(oldBlocks).toHaveLength(1);
      expect(oldBlocks[0]).toEqual({ type: "text", text: "[Earlier tool interaction]" });
    });

    it("preserves tool blocks in recent messages (within keepRecent)", () => {
      const msgs: ChatMessage[] = [
        user("old"),
        assistant("old reply"),
        user("recent"),
        assistant([
          { type: "mcp_tool_use" as const, id: "u-2", name: "search" },
          { type: "mcp_tool_result" as const, tool_use_id: "u-2", content: "data" },
        ]),
      ];

      const result = compactOldMessages(msgs, 4);
      expect(result).toBe(msgs);
    });

    it("does not mutate original messages", () => {
      const original: ChatMessage[] = [
        user("q"),
        assistant([
          { type: "mcp_tool_use" as const, id: "u-1", name: "s" },
          { type: "mcp_tool_result" as const, tool_use_id: "u-1", content: "data" },
        ]),
        user("a"),
        assistant("b"),
        user("c"),
        assistant("d"),
      ];

      const originalBlocks = original[1].content as ContentBlock[];
      const originalBlock = originalBlocks[0];
      compactOldMessages(original, 4);
      // Original should be unchanged
      expect(originalBlocks[0]).toBe(originalBlock);
      expect(originalBlocks).toHaveLength(2);
    });

    it("leaves text-only assistant messages unchanged in old section", () => {
      const msgs: ChatMessage[] = [
        user("q"),
        assistant([{ type: "text" as const, text: "just text" }]),
        user("a"),
        assistant("b"),
        user("c"),
        assistant("d"),
      ];

      const result = compactOldMessages(msgs, 4);
      // Text-only assistant should be returned as-is (same reference)
      expect(result[1]).toBe(msgs[1]);
    });

    it("preserves user messages in old section unchanged", () => {
      const msgs: ChatMessage[] = [
        user("old user msg"),
        assistant([
          { type: "mcp_tool_use" as const, id: "u-1", name: "s" },
          { type: "mcp_tool_result" as const, tool_use_id: "u-1", content: "data" },
        ]),
        user("a"),
        assistant("b"),
        user("c"),
        assistant("d"),
      ];

      const result = compactOldMessages(msgs, 4);
      expect(result[0]).toBe(msgs[0]);
      expect(result[0].content).toBe("old user msg");
    });
  });
});
