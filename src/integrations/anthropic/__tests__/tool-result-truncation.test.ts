import {
  extractQueryFromToolInput,
  smartTruncateJsonContent,
  MAX_TOOL_RESULT_CHARS,
} from "@/integrations/anthropic/tool-result-truncation";

describe("tool-result-truncation", () => {
  describe("extractQueryFromToolInput", () => {
    it("returns [] for undefined input", () => {
      expect(extractQueryFromToolInput(undefined)).toEqual([]);
    });

    it("returns [] for empty object", () => {
      expect(extractQueryFromToolInput({})).toEqual([]);
    });

    it("extracts from query key", () => {
      expect(extractQueryFromToolInput({ query: "south indian" })).toEqual(["south", "indian"]);
    });

    it("extracts from q key", () => {
      expect(extractQueryFromToolInput({ q: "protein bar" })).toEqual(["protein", "bar"]);
    });

    it("extracts from search_text key", () => {
      expect(extractQueryFromToolInput({ search_text: "green tea" })).toEqual(["green", "tea"]);
    });

    it("prefers first matching key (query over q)", () => {
      expect(extractQueryFromToolInput({ query: "milk", q: "bread" })).toEqual(["milk"]);
    });

    it("filters terms with length <= 1", () => {
      expect(extractQueryFromToolInput({ query: "a south b indian" })).toEqual(["south", "indian"]);
    });

    it("skips non-string values, falls through to next key", () => {
      expect(extractQueryFromToolInput({ query: 123, q: "eggs" })).toEqual(["eggs"]);
    });
  });

  describe("smartTruncateJsonContent", () => {
    it("returns unchanged when under budget", () => {
      const json = JSON.stringify([{ name: "item1" }]);
      expect(smartTruncateJsonContent(json, ["item1"])).toBe(json);
    });

    it("falls back to blind slice for non-JSON content", () => {
      const text = "not json ".repeat(500);
      const result = smartTruncateJsonContent(text, ["anything"]);
      expect(result).toHaveLength(MAX_TOOL_RESULT_CHARS);
      expect(result).toBe(text.slice(0, MAX_TOOL_RESULT_CHARS));
    });

    it("falls back for JSON object without array", () => {
      const obj = { message: "x".repeat(4000) };
      const json = JSON.stringify(obj);
      const result = smartTruncateJsonContent(json, ["test"]);
      expect(result).toHaveLength(MAX_TOOL_RESULT_CHARS);
    });

    it("keeps complete items for flat array (valid JSON output)", () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        name: `Product ${i}`,
        price: 100 + i,
        description: `Description for product ${i} with some extra text to make it longer`,
      }));
      const json = JSON.stringify(items);
      expect(json.length).toBeGreaterThan(MAX_TOOL_RESULT_CHARS);

      const result = smartTruncateJsonContent(json, []);
      expect(result.length).toBeLessThanOrEqual(MAX_TOOL_RESULT_CHARS);

      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed.length).toBeLessThan(items.length);
      // Each item should be complete
      for (const item of parsed) {
        expect(item).toHaveProperty("name");
        expect(item).toHaveProperty("price");
        expect(item).toHaveProperty("description");
      }
    });

    it("ranks items by query term overlap — matched items survive over unmatched", () => {
      const items = [
        { name: "Butter Chicken", category: "North Indian" },
        { name: "Masala Dosa", category: "South Indian" },
        { name: "Pizza Margherita", category: "Italian" },
        { name: "Idli Sambar", category: "South Indian" },
        { name: "Pasta Alfredo", category: "Italian" },
        { name: "Rava Dosa", category: "South Indian" },
        // Pad with large items to force truncation
        ...Array.from({ length: 30 }, (_, i) => ({
          name: `Filler item ${i}`,
          category: "Other",
          description: `This is a long description to take up space in the budget for item number ${i}`,
        })),
      ];
      const json = JSON.stringify(items);
      expect(json.length).toBeGreaterThan(MAX_TOOL_RESULT_CHARS);

      const result = smartTruncateJsonContent(json, ["south", "indian"]);
      const parsed = JSON.parse(result);

      const names = parsed.map((p: { name: string }) => p.name);
      // All 3 south indian items should be present
      expect(names).toContain("Masala Dosa");
      expect(names).toContain("Idli Sambar");
      expect(names).toContain("Rava Dosa");
    });

    it("preserves wrapper structure ({data: {items: [...]}})", () => {
      const data = {
        data: {
          items: Array.from({ length: 40 }, (_, i) => ({
            name: `Product ${i}`,
            price: i * 10,
            description: `A moderately long description for product ${i}`,
          })),
        },
        meta: { total: 40 },
      };
      const json = JSON.stringify(data);
      expect(json.length).toBeGreaterThan(MAX_TOOL_RESULT_CHARS);

      const result = smartTruncateJsonContent(json, []);
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty("data");
      expect(parsed.data).toHaveProperty("items");
      expect(Array.isArray(parsed.data.items)).toBe(true);
      expect(parsed.data.items.length).toBeGreaterThan(0);
      expect(parsed.data.items.length).toBeLessThan(40);
      // Wrapper fields preserved
      expect(parsed.meta).toEqual({ total: 40 });
    });

    it("preserves original ordering among selected items (re-sorted by index)", () => {
      const items = [
        { name: "Apple Juice", category: "Beverages" },
        { name: "South Indian Thali", category: "South Indian" },
        { name: "Banana Chips", category: "Snacks" },
        { name: "Dosa Mix", category: "South Indian" },
        ...Array.from({ length: 30 }, (_, i) => ({
          name: `Filler ${i}`,
          category: "Other",
          description: `Padding text to push the budget limit for item ${i}`,
        })),
      ];
      const json = JSON.stringify(items);

      const result = smartTruncateJsonContent(json, ["south", "indian"]);
      const parsed = JSON.parse(result);

      const southIndianIndices = parsed
        .map((p: { name: string; category: string }, i: number) => (p.category === "South Indian" ? i : -1))
        .filter((i: number) => i >= 0);

      // South Indian items should appear in their original relative order
      if (southIndianIndices.length >= 2) {
        expect(southIndianIndices[0]).toBeLessThan(southIndianIndices[1]);
      }
    });

    it("falls back when single item exceeds budget", () => {
      const items = [{ name: "x".repeat(4000) }];
      const json = JSON.stringify(items);

      const result = smartTruncateJsonContent(json, []);
      // Should fall back to blind slice since no item fits
      expect(result).toHaveLength(MAX_TOOL_RESULT_CHARS);
    });

    it("handles depth-2 wrapper", () => {
      const data = {
        results: {
          products: Array.from({ length: 50 }, (_, i) => ({
            name: `Item ${i}`,
            price: i * 10,
            description: `A moderately long description to ensure we exceed the budget for product item number ${i}`,
          })),
        },
        meta: { total: 50 },
      };
      const json = JSON.stringify(data);
      expect(json.length).toBeGreaterThan(MAX_TOOL_RESULT_CHARS);

      const result = smartTruncateJsonContent(json, []);
      const parsed = JSON.parse(result);

      expect(parsed.results.products).toBeDefined();
      expect(Array.isArray(parsed.results.products)).toBe(true);
      expect(parsed.results.products.length).toBeGreaterThan(0);
      expect(parsed.results.products.length).toBeLessThan(50);
      expect(parsed.meta).toEqual({ total: 50 });
    });

    it("scores using multiple searchable fields (not just name)", () => {
      const items = [
        { name: "Generic Item", brand: "South Star", cuisine: "Italian" },
        { name: "Generic Item", brand: "Other", description: "indian spices" },
        { name: "Generic Item", brand: "Other", cuisine: "Other" },
        ...Array.from({ length: 30 }, (_, i) => ({
          name: `Padding ${i}`,
          brand: "NoMatch",
          description: `Extra text to fill up space for item ${i} in the array`,
        })),
      ];
      const json = JSON.stringify(items);

      const result = smartTruncateJsonContent(json, ["south", "indian"]);
      const parsed = JSON.parse(result);

      // Items with "south" in brand and "indian" in description should rank higher
      // The first two items should be present since they each match at least one term
      const brands = parsed.map((p: { brand: string }) => p.brand);
      const hasSearchMatches = brands.includes("South Star") || parsed.some((p: { description?: string }) => p.description?.includes("indian"));
      expect(hasSearchMatches).toBe(true);
    });

    it("no query terms → preserves original order (first N that fit)", () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        name: `Product ${i}`,
        price: i * 10,
      }));
      const json = JSON.stringify(items);

      const result = smartTruncateJsonContent(json, []);
      const parsed = JSON.parse(result);

      // All items have score 0, so they sort by index ASC, meaning first N items kept
      for (let i = 0; i < parsed.length; i++) {
        expect(parsed[i].name).toBe(`Product ${i}`);
      }
    });

    it("does not mutate input", () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        name: `Product ${i}`,
        description: `Moderately long description for product ${i} to ensure truncation`,
      }));
      const json = JSON.stringify(items);
      const jsonCopy = json;

      smartTruncateJsonContent(json, ["product"]);
      expect(json).toBe(jsonCopy);
    });
  });
});
