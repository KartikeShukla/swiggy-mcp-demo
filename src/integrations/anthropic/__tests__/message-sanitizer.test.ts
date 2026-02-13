import {
  sanitizeAssistantBlocks,
  sanitizeMessagesForApi,
  truncateOldToolResults,
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

  describe("truncateOldToolResults", () => {
    function user(content: string): ChatMessage {
      return { role: "user", content, timestamp: Date.now() };
    }

    function assistant(content: string | ContentBlock[]): ChatMessage {
      return { role: "assistant", content, timestamp: Date.now() };
    }

    it("returns messages unchanged when length <= keepRecent", () => {
      const msgs = [user("hi"), assistant("hello")];
      const result = truncateOldToolResults(msgs, 4);
      expect(result).toBe(msgs);
    });

    it("truncates large JSON array tool results in older messages", () => {
      const largeArray = JSON.stringify(Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}` })));
      const msgs: ChatMessage[] = [
        user("search"),
        assistant([
          { type: "text" as const, text: "Found items" },
          { type: "mcp_tool_use" as const, id: "u-1", name: "search" },
          { type: "mcp_tool_result" as const, tool_use_id: "u-1", content: largeArray },
        ]),
        user("next"),
        assistant("ok"),
        user("more"),
        assistant("sure"),
        user("even more"),
        assistant("yep"),
        user("continue"),
        assistant("done"),
      ];

      const result = truncateOldToolResults(msgs, 8);

      // Older assistant message (index 1) should be truncated
      const oldAssistant = result[1];
      expect(Array.isArray(oldAssistant.content)).toBe(true);
      const blocks = oldAssistant.content as ContentBlock[];
      const toolResult = blocks.find((b) => b.type === "mcp_tool_result");
      expect(toolResult).toBeDefined();
      expect((toolResult as { content: string }).content).toBe("[Previous result: 100 items]");
    });

    it("truncates large JSON object tool results with key summary", () => {
      const largeObj = JSON.stringify({ products: [], total: 100, filters: {}, metadata: {} });
      const padded = largeObj + " ".repeat(2000);
      const msgs: ChatMessage[] = [
        user("q1"),
        assistant([
          { type: "mcp_tool_use" as const, id: "u-1", name: "search" },
          { type: "mcp_tool_result" as const, tool_use_id: "u-1", content: padded },
        ]),
        user("q2"),
        assistant("response2"),
        user("q3"),
        assistant("response3"),
        user("q4"),
        assistant("response4"),
        user("q5"),
        assistant("response5"),
      ];

      const result = truncateOldToolResults(msgs, 8);
      const oldBlocks = result[1].content as ContentBlock[];
      const toolResult = oldBlocks.find((b) => b.type === "mcp_tool_result");
      expect((toolResult as { content: string }).content).toContain("[Previous result: object with keys:");
      expect((toolResult as { content: string }).content).toContain("products");
    });

    it("preserves tool results in recent messages (within keepRecent)", () => {
      const largeContent = JSON.stringify(Array.from({ length: 50 }, (_, i) => i));
      const msgs: ChatMessage[] = [
        user("old"),
        assistant("old reply"),
        user("recent"),
        assistant([
          { type: "mcp_tool_use" as const, id: "u-2", name: "search" },
          { type: "mcp_tool_result" as const, tool_use_id: "u-2", content: largeContent },
        ]),
      ];

      const result = truncateOldToolResults(msgs, 4);
      // All 4 messages are within keepRecent — no truncation
      expect(result).toBe(msgs);
    });

    it("preserves tool_use_id on truncated results", () => {
      const largeContent = JSON.stringify(Array.from({ length: 600 }, (_, i) => i));
      const msgs: ChatMessage[] = [
        user("q"),
        assistant([
          { type: "mcp_tool_use" as const, id: "u-99", name: "fetch" },
          { type: "mcp_tool_result" as const, tool_use_id: "u-99", content: largeContent },
        ]),
        user("a"),
        assistant("b"),
        user("c"),
        assistant("d"),
        user("e"),
        assistant("f"),
        user("g"),
        assistant("h"),
      ];

      const result = truncateOldToolResults(msgs, 8);
      const blocks = result[1].content as ContentBlock[];
      const toolResult = blocks.find((b) => b.type === "mcp_tool_result") as { tool_use_id: string };
      expect(toolResult.tool_use_id).toBe("u-99");
    });

    it("does not mutate original messages", () => {
      const largeContent = JSON.stringify(Array.from({ length: 600 }, (_, i) => i));
      const original: ChatMessage[] = [
        user("q"),
        assistant([
          { type: "mcp_tool_use" as const, id: "u-1", name: "s" },
          { type: "mcp_tool_result" as const, tool_use_id: "u-1", content: largeContent },
        ]),
        user("a"),
        assistant("b"),
        user("c"),
        assistant("d"),
        user("e"),
        assistant("f"),
        user("g"),
        assistant("h"),
      ];

      const originalContent = (original[1].content as ContentBlock[])[1];
      truncateOldToolResults(original, 8);
      // Original should be unchanged
      expect((originalContent as { content: string }).content).toBe(largeContent);
    });

    it("leaves small tool results unchanged", () => {
      const smallContent = JSON.stringify({ ok: true });
      const msgs: ChatMessage[] = [
        user("q"),
        assistant([
          { type: "mcp_tool_use" as const, id: "u-1", name: "s" },
          { type: "mcp_tool_result" as const, tool_use_id: "u-1", content: smallContent },
        ]),
        user("a"),
        assistant("b"),
        user("c"),
        assistant("d"),
      ];

      const result = truncateOldToolResults(msgs, 4);
      const blocks = result[1].content as ContentBlock[];
      const toolResult = blocks.find((b) => b.type === "mcp_tool_result") as { content: string };
      expect(toolResult.content).toBe(smallContent);
    });
  });
});
