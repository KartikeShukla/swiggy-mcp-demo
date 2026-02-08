import { parseToolResult } from "@/lib/parsers/orchestrator";

describe("parseToolResult()", () => {
  describe("tool name routing: search/find/discover/browse/menu -> products", () => {
    it("routes search tool to products for instamart vertical", () => {
      const content = JSON.stringify([
        { name: "Milk", price: 55, image: "img.jpg" },
      ]);
      const result = parseToolResult("search_products", content, "instamart");
      expect(result.type).toBe("products");
    });

    it("routes find tool to products", () => {
      const content = JSON.stringify([
        { name: "Bread", price: 30 },
      ]);
      const result = parseToolResult("find_items", content, "instamart");
      expect(result.type).toBe("products");
    });

    it("routes browse tool to products", () => {
      const content = JSON.stringify([
        { name: "Chips", price: 20 },
      ]);
      const result = parseToolResult("browse_category", content, "instamart");
      expect(result.type).toBe("products");
    });

    it("routes discover tool to products", () => {
      const content = JSON.stringify([
        { name: "Juice", price: 45 },
      ]);
      const result = parseToolResult("discover_products", content, "instamart");
      expect(result.type).toBe("products");
    });
  });

  describe("tool name routing: cart/basket -> cart", () => {
    it("routes cart tool to cart type", () => {
      const content = JSON.stringify({
        items: [{ name: "Item A", price: 100, quantity: 2 }],
        total: 200,
      });
      const result = parseToolResult("get_cart", content, "instamart");
      expect(result.type).toBe("cart");
    });

    it("routes basket tool to cart type", () => {
      const content = JSON.stringify({
        items: [{ name: "Item B", price: 50, quantity: 1 }],
      });
      const result = parseToolResult("view_basket", content, "instamart");
      expect(result.type).toBe("cart");
    });
  });

  describe("tool name routing: slot/avail -> time_slots", () => {
    it("routes slot tool to time_slots type", () => {
      const content = JSON.stringify(["10:00 AM", "11:00 AM"]);
      const result = parseToolResult("get_slots", content, "instamart");
      expect(result.type).toBe("time_slots");
    });

    it("routes avail tool to time_slots type", () => {
      const content = JSON.stringify([
        { time: "2:00 PM", available: true },
      ]);
      const result = parseToolResult("check_availability", content, "instamart");
      expect(result.type).toBe("time_slots");
    });
  });

  describe("tool name routing: address/location -> addresses", () => {
    it("routes address tool to addresses type", () => {
      const content = JSON.stringify([
        { address: "123 Main St", label: "Home" },
      ]);
      const result = parseToolResult("get_addresses", content, "instamart");
      expect(result.type).toBe("addresses");
    });

    it("routes location tool to addresses type", () => {
      const content = JSON.stringify([
        { address: "456 Oak Ave", label: "Work" },
      ]);
      const result = parseToolResult("set_location", content, "instamart");
      expect(result.type).toBe("addresses");
    });
  });

  describe("tool name routing: order/place/book/reserve/confirm -> confirmation", () => {
    it("routes order tool to order_placed type", () => {
      const content = JSON.stringify({ order_id: "O1", status: "confirmed" });
      const result = parseToolResult("place_order", content, "instamart");
      expect(result.type).toBe("order_placed");
    });

    it("routes book tool to booking_confirmed type", () => {
      const content = JSON.stringify({ reservation_id: "R1" });
      const result = parseToolResult("book_table", content, "dining");
      expect(result.type).toBe("booking_confirmed");
    });

    it("routes confirm tool to order_placed (order match first)", () => {
      // 'confirm' does not match /order|place/ so falls through,
      // but it does match /order|place|book|reserve|confirm/
      const content = JSON.stringify({ id: "C1" });
      const result = parseToolResult("confirm_booking", content, "dining");
      // 'confirm' matches the pattern, but not /order|place/ so tryParseConfirmation
      // is called with toolName "confirm_booking". /book|reserve/ matches.
      expect(result.type).toBe("booking_confirmed");
    });
  });

  describe("vertical-specific routing: dining -> restaurants first", () => {
    it("routes search to restaurants first for dining vertical", () => {
      const content = JSON.stringify([
        { name: "Pizza Palace", cuisine: "Italian", rating: 4.5 },
      ]);
      const result = parseToolResult("search_restaurants", content, "dining");
      expect(result.type).toBe("restaurants");
    });

    it("routes search to restaurants first for foodorder vertical", () => {
      const content = JSON.stringify([
        { name: "Burger Joint", cuisine: "American", rating: 4.0 },
      ]);
      const result = parseToolResult("search_food", content, "foodorder");
      expect(result.type).toBe("restaurants");
    });

    it("falls back to products for dining vertical when restaurants fails", () => {
      // Items that don't look like restaurants
      const content = JSON.stringify([
        { name: "Naan", price: 60 },
      ]);
      // For dining vertical, restaurants parse attempted first but fails,
      // then for dining vertical products is NOT attempted (verticalId === "dining")
      // falls through to shape detection, which calls tryParseProducts
      const result = parseToolResult("search_dishes", content, "dining");
      expect(result.type).toBe("products");
    });

    it("routes menu tool to products for foodorder vertical", () => {
      const content = JSON.stringify([
        { name: "Biryani", price: 250 },
      ]);
      const result = parseToolResult("get_menu", content, "foodorder");
      expect(result.type).toBe("products");
    });
  });

  describe("shape detection fallback", () => {
    it("detects product-like shape without tool name hint", () => {
      const content = JSON.stringify([
        { name: "Widget", price: 100 },
      ]);
      const result = parseToolResult("unknown_tool", content, "instamart");
      expect(result.type).toBe("products");
    });

    it("detects restaurant-like shape without tool name hint", () => {
      const content = JSON.stringify([
        { name: "Restaurant X", cuisine: "Indian", rating: 4.0 },
      ]);
      const result = parseToolResult("unknown_tool", content, "instamart");
      expect(result.type).toBe("restaurants");
    });

    it("detects time slot shape without tool name hint", () => {
      const content = JSON.stringify([
        { time: "10:00 AM", available: true },
      ]);
      const result = parseToolResult("unknown_tool", content, "instamart");
      expect(result.type).toBe("time_slots");
    });
  });

  describe("status fallback", () => {
    it("parses status when no other type matches", () => {
      const content = JSON.stringify({ success: true, message: "Done" });
      const result = parseToolResult("unknown_action", content, "instamart");
      expect(result.type).toBe("status");
    });

    it("parses success=false status", () => {
      const content = JSON.stringify({ success: false, message: "Error occurred" });
      const result = parseToolResult("do_thing", content, "instamart");
      expect(result.type).toBe("status");
      if (result.type !== "status") return;
      expect(result.status.success).toBe(false);
    });
  });

  describe("info fallback", () => {
    it("falls back to info for generic objects", () => {
      const content = JSON.stringify({ name: "Profile", age: 25, city: "Bangalore" });
      const result = parseToolResult("get_profile", content, "instamart");
      expect(result.type).toBe("info");
      if (result.type !== "info") return;
      expect(result.title).toBe("Profile");
    });
  });

  describe("raw fallback", () => {
    it("returns raw for completely unknown content", () => {
      const result = parseToolResult("unknown_tool", "just a string", "instamart");
      expect(result.type).toBe("raw");
    });

    it("returns raw for null content", () => {
      const result = parseToolResult("unknown_tool", null, "instamart");
      expect(result.type).toBe("raw");
    });

    it("returns raw for empty string", () => {
      const result = parseToolResult("unknown_tool", "", "instamart");
      expect(result.type).toBe("raw");
    });
  });

  describe("BetaTextBlock unwrapping", () => {
    it("unwraps BetaTextBlock content before parsing", () => {
      const content = [
        {
          type: "text",
          text: JSON.stringify([{ name: "Product", price: 99 }]),
          citations: null,
        },
      ];
      const result = parseToolResult("search_items", content, "instamart");
      expect(result.type).toBe("products");
    });
  });

  describe("extractPayload unwrapping", () => {
    it("extracts nested data.items before parsing", () => {
      const content = JSON.stringify({
        data: {
          items: [{ name: "Nested Product", price: 50 }],
        },
      });
      const result = parseToolResult("search_items", content, "instamart");
      expect(result.type).toBe("products");
    });
  });

  describe("error handling", () => {
    it("returns raw when parsing throws", () => {
      // Create an object that would cause issues - a circular ref can't be passed
      // as JSON string, but we can test with weird input
      const weirdContent = { toString: () => { throw new Error("boom"); } };
      const result = parseToolResult("search", weirdContent, "instamart");
      // Should not throw, should return some result
      expect(result).toBeDefined();
    });
  });
});
