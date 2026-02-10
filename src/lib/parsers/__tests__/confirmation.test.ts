import { tryParseConfirmation } from "@/lib/parsers/confirmation";

describe("tryParseConfirmation()", () => {
  describe("order placement detection", () => {
    it("detects order placement by tool name containing 'order'", () => {
      const result = tryParseConfirmation(
        { order_id: "ORD123", status: "confirmed" },
        "place_order",
      );
      expect(result).not.toBeNull();
      expect(result!.type).toBe("order_placed");
      if (result!.type !== "order_placed") return;
      expect(result!.orderId).toBe("ORD123");
      expect(result!.status).toBe("confirmed");
    });

    it("detects order placement by tool name containing 'place'", () => {
      const result = tryParseConfirmation(
        { orderId: "O456" },
        "place_food_delivery",
      );
      expect(result).not.toBeNull();
      if (result!.type !== "order_placed") return;
      expect(result!.orderId).toBe("O456");
    });

    it("uses 'Order placed' as default status when no status/message", () => {
      const result = tryParseConfirmation({}, "create_order");
      if (result!.type !== "order_placed") return;
      expect(result!.status).toBe("Order placed");
    });

    it("resolves orderId from 'id' key", () => {
      const result = tryParseConfirmation({ id: "ID789" }, "submit_order");
      if (result!.type !== "order_placed") return;
      expect(result!.orderId).toBe("ID789");
    });

    it("resolves status from 'message' key", () => {
      const result = tryParseConfirmation(
        { message: "Your order is on the way" },
        "order_submit",
      );
      if (result!.type !== "order_placed") return;
      expect(result!.status).toBe("Your order is on the way");
    });

    it("is case-insensitive for tool name matching", () => {
      const result = tryParseConfirmation({}, "PlaceOrder");
      expect(result).not.toBeNull();
      expect(result!.type).toBe("order_placed");
    });
  });

  describe("booking confirmation detection", () => {
    it("detects booking confirmation by tool name containing 'book'", () => {
      const details = { restaurant: "Pizza Place", time: "7:00 PM" };
      const result = tryParseConfirmation(details, "book_table");
      expect(result).not.toBeNull();
      expect(result!.type).toBe("booking_confirmed");
      if (result!.type !== "booking_confirmed") return;
      expect(result!.details).toBe(details);
    });

    it("detects booking confirmation by tool name containing 'reserve'", () => {
      const result = tryParseConfirmation(
        { reservation_id: "R1" },
        "reserve_slot",
      );
      expect(result).not.toBeNull();
      expect(result!.type).toBe("booking_confirmed");
    });

    it("is case-insensitive for tool name matching", () => {
      const result = tryParseConfirmation({}, "BookReservation");
      expect(result).not.toBeNull();
      expect(result!.type).toBe("booking_confirmed");
    });
  });

  describe("non-matching tool names", () => {
    it("returns null for tool names that don't match order or booking", () => {
      expect(tryParseConfirmation({}, "search_restaurants")).toBeNull();
      expect(tryParseConfirmation({}, "get_menu")).toBeNull();
      expect(tryParseConfirmation({}, "add_to_cart")).toBeNull();
      expect(tryParseConfirmation({}, "get_slots")).toBeNull();
    });
  });

  describe("invalid payload", () => {
    it("returns null for null payload", () => {
      expect(tryParseConfirmation(null, "place_order")).toBeNull();
    });

    it("returns null for non-object payload", () => {
      expect(tryParseConfirmation("string", "place_order")).toBeNull();
      expect(tryParseConfirmation(42, "place_order")).toBeNull();
    });
  });

  describe("priority: order detection takes priority over booking", () => {
    it("matches order when tool name contains both 'order' and 'book'", () => {
      // 'order' pattern is checked first
      const result = tryParseConfirmation({}, "order_booking");
      expect(result).not.toBeNull();
      expect(result!.type).toBe("order_placed");
    });
  });
});
