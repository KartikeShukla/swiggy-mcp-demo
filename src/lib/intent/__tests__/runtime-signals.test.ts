import { detectLoadingContext, detectParserIntent } from "@/lib/intent/runtime-signals";

describe("runtime-signals", () => {
  describe("detectLoadingContext", () => {
    it("detects explicit cart intents", () => {
      expect(detectLoadingContext("add this to my cart", "foodorder")).toBe("cart");
    });

    it("falls back to vertical defaults", () => {
      expect(detectLoadingContext("hello", "food")).toBe("nutrition");
      expect(detectLoadingContext("hello", "style")).toBe("style");
      expect(detectLoadingContext("hello", "dining")).toBe("restaurant");
      expect(detectLoadingContext("hello", "foodorder")).toBe("menu");
    });
  });

  describe("detectParserIntent", () => {
    it("detects confirmation intents", () => {
      expect(detectParserIntent("yes do it, place order", "foodorder")).toBe("confirm");
    });

    it("detects menu and availability intents by vertical", () => {
      expect(detectParserIntent("show menu please", "foodorder")).toBe("menu");
      expect(detectParserIntent("check time slot", "dining")).toBe("availability");
    });

    it("defaults to discover", () => {
      expect(detectParserIntent("recommend something", "foodorder")).toBe("discover");
    });
  });
});
