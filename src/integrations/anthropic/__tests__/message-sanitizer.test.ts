import {
  sanitizeAssistantBlocks,
  sanitizeMessagesForApi,
  compactOldMessages,
  truncateToolResultsInMessages,
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

  describe("truncateToolResultsInMessages", () => {
    function user(content: string): ChatMessage {
      return { role: "user", content, timestamp: Date.now() };
    }

    function assistant(content: string | ContentBlock[]): ChatMessage {
      return { role: "assistant", content, timestamp: Date.now() };
    }

    it("returns same reference when nothing needs truncation", () => {
      const msgs = [user("hi"), assistant("hello")];
      const result = truncateToolResultsInMessages(msgs);
      expect(result).toBe(msgs);
    });

    it("truncates string content exceeding 3000 chars", () => {
      const longContent = "x".repeat(5000);
      const msgs: ChatMessage[] = [
        user("search"),
        assistant([
          { type: "mcp_tool_use", id: "u-1", name: "search" },
          { type: "mcp_tool_result", tool_use_id: "u-1", content: longContent },
        ]),
      ];

      const result = truncateToolResultsInMessages(msgs);
      const blocks = result[1].content as ContentBlock[];
      const resultBlock = blocks[1] as { type: string; content: string };
      expect(resultBlock.content).toHaveLength(3000);
    });

    it("truncates array content text entries exceeding 3000 chars", () => {
      const longText = "y".repeat(4000);
      const msgs: ChatMessage[] = [
        user("q"),
        assistant([
          { type: "mcp_tool_use", id: "u-1", name: "search" },
          {
            type: "mcp_tool_result",
            tool_use_id: "u-1",
            content: [{ type: "text", text: longText }],
          },
        ]),
      ];

      const result = truncateToolResultsInMessages(msgs);
      const blocks = result[1].content as ContentBlock[];
      const resultBlock = blocks[1] as { type: string; content: Array<{ text: string }> };
      expect(resultBlock.content[0].text).toHaveLength(3000);
    });

    it("does not truncate content at exactly 3000 chars", () => {
      const exactContent = "z".repeat(3000);
      const msgs: ChatMessage[] = [
        user("q"),
        assistant([
          { type: "mcp_tool_use", id: "u-1", name: "search" },
          { type: "mcp_tool_result", tool_use_id: "u-1", content: exactContent },
        ]),
      ];

      const result = truncateToolResultsInMessages(msgs);
      expect(result).toBe(msgs);
    });

    it("preserves non-tool-result blocks unchanged", () => {
      const msgs: ChatMessage[] = [
        user("q"),
        assistant([
          { type: "text", text: "x".repeat(5000) },
          { type: "mcp_tool_use", id: "u-1", name: "search" },
          { type: "mcp_tool_result", tool_use_id: "u-1", content: "short" },
        ]),
      ];

      const result = truncateToolResultsInMessages(msgs);
      expect(result).toBe(msgs);
      const blocks = result[1].content as ContentBlock[];
      expect((blocks[0] as { text: string }).text).toHaveLength(5000);
    });

    it("skips non-assistant messages", () => {
      const msgs: ChatMessage[] = [
        user("x".repeat(5000)),
        assistant("text reply"),
      ];

      const result = truncateToolResultsInMessages(msgs);
      expect(result).toBe(msgs);
    });

    it("does not mutate original messages", () => {
      const longContent = "a".repeat(5000);
      const originalBlock = {
        type: "mcp_tool_result" as const,
        tool_use_id: "u-1",
        content: longContent,
      };
      const msgs: ChatMessage[] = [
        user("q"),
        assistant([
          { type: "mcp_tool_use", id: "u-1", name: "search" },
          originalBlock,
        ]),
      ];

      truncateToolResultsInMessages(msgs);
      expect(originalBlock.content).toHaveLength(5000);
    });

    it("smart-truncates valid JSON tool results, preferring query-relevant items", () => {
      const products = [
        ...Array.from({ length: 20 }, (_, i) => ({
          name: `Filler Product ${i}`,
          category: "Other",
          description: `Some generic description for filler product ${i}`,
        })),
        { name: "Masala Dosa", category: "South Indian", description: "Crispy dosa" },
        { name: "Idli Sambar", category: "South Indian", description: "Steamed idli" },
      ];
      const jsonContent = JSON.stringify({ data: { items: products } });

      const msgs: ChatMessage[] = [
        user("search"),
        assistant([
          {
            type: "mcp_tool_use",
            id: "u-1",
            name: "search_products",
            input: { query: "south indian" },
          },
          { type: "mcp_tool_result", tool_use_id: "u-1", content: jsonContent },
        ]),
      ];

      const result = truncateToolResultsInMessages(msgs);
      const blocks = result[1].content as ContentBlock[];
      const resultBlock = blocks[1] as { type: string; content: string };
      const parsed = JSON.parse(resultBlock.content);

      // Should preserve wrapper structure
      expect(parsed.data.items).toBeDefined();
      // South Indian items should be present
      const names = parsed.data.items.map((p: { name: string }) => p.name);
      expect(names).toContain("Masala Dosa");
      expect(names).toContain("Idli Sambar");
    });

    it("produces valid JSON output when truncating a large product array", () => {
      const products = Array.from({ length: 50 }, (_, i) => ({
        name: `Product ${i}`,
        price: 100 + i,
        description: `A product description that adds length for item ${i}`,
      }));
      const jsonContent = JSON.stringify(products);

      const msgs: ChatMessage[] = [
        user("search"),
        assistant([
          {
            type: "mcp_tool_use",
            id: "u-1",
            name: "search_products",
            input: { query: "product" },
          },
          { type: "mcp_tool_result", tool_use_id: "u-1", content: jsonContent },
        ]),
      ];

      const result = truncateToolResultsInMessages(msgs);
      const blocks = result[1].content as ContentBlock[];
      const resultBlock = blocks[1] as { type: string; content: string };

      expect(resultBlock.content.length).toBeLessThanOrEqual(3000);
      // Must be valid JSON
      const parsed = JSON.parse(resultBlock.content);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
      // Each item should be complete
      for (const item of parsed) {
        expect(item).toHaveProperty("name");
        expect(item).toHaveProperty("price");
        expect(item).toHaveProperty("description");
      }
    });
  });
});
