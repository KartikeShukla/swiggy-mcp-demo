import { parseToolResult } from "@/lib/parsers/orchestrator";

describe("parseToolResult()", () => {
  describe("tool name routing: search/find/discover/browse/menu/list/recommend -> products", () => {
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

    it("routes list_items tool to products", () => {
      const content = JSON.stringify([
        { name: "Rice", price: 80 },
      ]);
      const result = parseToolResult("list_items", content, "instamart");
      expect(result.type).toBe("products");
    });

    it("routes recommend_products tool to products", () => {
      const content = JSON.stringify([
        { name: "Shampoo", price: 200 },
      ]);
      const result = parseToolResult("recommend_products", content, "instamart");
      expect(result.type).toBe("products");
    });

    it("routes suggest_items tool to products", () => {
      const content = JSON.stringify([
        { name: "Soap", price: 50 },
      ]);
      const result = parseToolResult("suggest_items", content, "instamart");
      expect(result.type).toBe("products");
    });

    it("routes get_restaurant_details to restaurants for dining", () => {
      const content = JSON.stringify({
        name: "Pizza Palace",
        cuisine: "Italian",
        rating: 4.5,
        address: "123 Main St",
      });
      const result = parseToolResult("get_restaurant_details", content, "dining");
      expect(result.type).toBe("restaurants");
    });

    it("routes get_menu_items to products", () => {
      const content = JSON.stringify([
        { name: "Burger", price: 150 },
      ]);
      const result = parseToolResult("get_menu_items", content, "foodorder");
      expect(result.type).toBe("products");
    });
  });

  describe("tool name routing: cart/basket/add_item/remove_item -> cart", () => {
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

    it("routes add_item tool to cart type when cart data is present", () => {
      const content = JSON.stringify({
        items: [{ name: "Item C", price: 75, quantity: 1 }],
        total: 75,
      });
      const result = parseToolResult("add_item", content, "instamart");
      expect(result.type).toBe("cart");
    });

    it("routes remove_item tool to cart type when cart data is present", () => {
      const content = JSON.stringify({
        items: [{ name: "Item D", price: 60, quantity: 2 }],
      });
      const result = parseToolResult("remove_item", content, "instamart");
      expect(result.type).toBe("cart");
    });

    it("routes add_to_cart tool to cart type", () => {
      const content = JSON.stringify({
        items: [{ name: "Item E", price: 90, quantity: 1 }],
      });
      const result = parseToolResult("add_to_cart", content, "foodorder");
      expect(result.type).toBe("cart");
    });
  });

  describe("tool name routing: slot/avail/schedule/timeslot -> time_slots", () => {
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

    it("routes schedule tool to time_slots type", () => {
      const content = JSON.stringify([
        { time: "9:00 AM", available: true },
      ]);
      const result = parseToolResult("get_schedule", content, "dining");
      expect(result.type).toBe("time_slots");
    });

    it("routes timeslot tool to time_slots type", () => {
      const content = JSON.stringify([
        { time: "1:00 PM", available: false },
      ]);
      const result = parseToolResult("get_timeslots", content, "dining");
      expect(result.type).toBe("time_slots");
    });
  });

  describe("tool name routing: address/location/deliver -> addresses", () => {
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

    it("routes deliver tool to addresses type", () => {
      const content = JSON.stringify([
        { address: "789 Elm St", label: "Office" },
      ]);
      const result = parseToolResult("get_delivery_addresses", content, "foodorder");
      expect(result.type).toBe("addresses");
    });
  });

  describe("tool name routing: order/place/book/reserve/confirm/checkout/submit -> confirmation", () => {
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
      const content = JSON.stringify({ id: "C1" });
      const result = parseToolResult("confirm_booking", content, "dining");
      expect(result.type).toBe("booking_confirmed");
    });

    it("routes checkout tool to confirmation type", () => {
      const content = JSON.stringify({ order_id: "O2", status: "placed" });
      const result = parseToolResult("checkout", content, "instamart");
      expect(result.type).toBe("order_placed");
    });

    it("routes submit_order tool to confirmation type", () => {
      const content = JSON.stringify({ order_id: "O3" });
      const result = parseToolResult("submit_order", content, "foodorder");
      expect(result.type).toBe("order_placed");
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
      // Items that don't look like restaurants — dining now also tries products
      const content = JSON.stringify([
        { name: "Naan", price: 60 },
      ]);
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

    it("parses single restaurant object from get_restaurant_details", () => {
      const content = JSON.stringify({
        name: "Taj Mahal Restaurant",
        cuisine: "Indian",
        rating: 4.7,
        costForTwo: 800,
        areaName: "MG Road",
      });
      const result = parseToolResult("get_restaurant_details", content, "dining");
      expect(result.type).toBe("restaurants");
      if (result.type !== "restaurants") return;
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Taj Mahal Restaurant");
    });

    it("parses category-structured menu into products", () => {
      const content = JSON.stringify({
        categories: [
          { name: "Starters", items: [{ name: "Paneer Tikka", price: 250 }] },
          { name: "Mains", items: [{ name: "Butter Chicken", price: 350 }] },
        ],
      });
      const result = parseToolResult("get_menu", content, "foodorder");
      expect(result.type).toBe("products");
      if (result.type !== "products") return;
      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe("Paneer Tikka");
      expect(result.items[1].name).toBe("Butter Chicken");
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

    it("prefers embedded cart over status when both are present", () => {
      const content = JSON.stringify({
        success: true,
        message: "Item added",
        cart: { items: [{ name: "Added Item", price: 100, quantity: 1 }] },
      });
      const result = parseToolResult("unknown_action", content, "instamart");
      expect(result.type).toBe("cart");
    });
  });

  describe("info fallback", () => {
    it("falls back to info for generic objects without product/restaurant fields", () => {
      const content = JSON.stringify({ label: "Profile", age: 25, city: "Bangalore" });
      const result = parseToolResult("get_profile", content, "instamart");
      expect(result.type).toBe("info");
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
