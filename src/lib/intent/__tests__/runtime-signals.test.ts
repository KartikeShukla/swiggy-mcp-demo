import { detectLoadingContext, detectParserIntent } from "@/lib/intent/runtime-signals";

describe("runtime-signals", () => {
  describe("detectLoadingContext", () => {
    it("detects explicit cart intents", () => {
      expect(detectLoadingContext("add this to my cart", "foodorder")).toBe("cart");
    });

    it("does not treat advisory add-phrasing as cart in food/style", () => {
      expect(detectLoadingContext("add more protein to this recipe", "food")).toBe("nutrition");
      expect(detectLoadingContext("add one exfoliation step to my routine", "style")).toBe("style");
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

    it("keeps food/style advisory phrasing in discover mode", () => {
      expect(detectParserIntent("add more protein to this recipe", "food")).toBe("discover");
      expect(detectParserIntent("add one serum step to my skincare routine", "style")).toBe("discover");
    });

    it("still treats explicit cart operations as cart for food/style", () => {
      expect(detectParserIntent("add this to my cart", "food")).toBe("cart");
      expect(detectParserIntent("change sunscreen quantity to 2", "style")).toBe("cart");
    });

    it("defaults to discover", () => {
      expect(detectParserIntent("recommend something", "foodorder")).toBe("discover");
    });
  });
});
