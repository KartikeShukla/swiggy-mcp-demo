import { detectByShape } from "@/lib/parsers/shape-detect";

describe("detectByShape()", () => {
  describe("restaurant-like shapes", () => {
    it("detects restaurant by cuisine + name", () => {
      const result = detectByShape(
        [{ name: "Pizza Place", cuisine: "Italian" }],
        "instamart",
      );
      expect(result?.type).toBe("restaurants");
    });

    it("detects restaurant by cuisines + name", () => {
      const result = detectByShape(
        [{ name: "Multi", cuisines: ["Indian", "Chinese"] }],
        "instamart",
      );
      expect(result?.type).toBe("restaurants");
    });

    it("detects restaurant by rating + name", () => {
      const result = detectByShape(
        [{ name: "Rated", rating: 4.5 }],
        "instamart",
      );
      expect(result?.type).toBe("restaurants");
    });

    it("detects restaurant by avgRating + name", () => {
      const result = detectByShape(
        [{ name: "Rated", avgRating: 4.2 }],
        "dining",
      );
      expect(result?.type).toBe("restaurants");
    });

    it("treats rating-only rows as products for foodorder by default", () => {
      const result = detectByShape(
        [{ name: "Rated", avg_rating: 3.8 }],
        "foodorder",
      );
      expect(result?.type).toBe("products");
    });

    it("keeps rating-only rows as restaurants for explicit restaurant discovery tools", () => {
      const result = detectByShape(
        [{ name: "Rated", avg_rating: 3.8 }],
        "foodorder",
        "search_restaurants",
      );
      expect(result?.type).toBe("restaurants");
    });

    it("prefers products for dish-like names even when tool says search_restaurants", () => {
      const result = detectByShape(
        [{ name: "Paneer Tikka Masala", avg_rating: 4.2 }],
        "foodorder",
        "search_restaurants",
      );
      expect(result?.type).toBe("products");
    });

    it("detects restaurant by deliveryTime + name", () => {
      const result = detectByShape(
        [{ name: "Fast", deliveryTime: "30 min" }],
        "foodorder",
      );
      expect(result?.type).toBe("restaurants");
    });

    it("detects restaurant by delivery_time + name", () => {
      const result = detectByShape(
        [{ name: "Fast", delivery_time: 25 }],
        "foodorder",
      );
      expect(result?.type).toBe("restaurants");
    });

    it("detects restaurant by costForTwo + name", () => {
      const result = detectByShape(
        [{ name: "Budget", costForTwo: 400 }],
        "dining",
      );
      expect(result?.type).toBe("restaurants");
    });

    it("detects restaurant by cost_for_two + name", () => {
      const result = detectByShape(
        [{ name: "Budget", cost_for_two: 350 }],
        "dining",
      );
      expect(result?.type).toBe("restaurants");
    });

    it("detects restaurant by areaName + name", () => {
      const result = detectByShape(
        [{ name: "Local", areaName: "Koramangala" }],
        "dining",
      );
      expect(result?.type).toBe("restaurants");
    });

    it("detects restaurant by sla + name", () => {
      const result = detectByShape(
        [{ name: "Sla", sla: { deliveryTime: 30 } }],
        "foodorder",
      );
      expect(result?.type).toBe("restaurants");
    });
  });

  describe("product-like shapes", () => {
    it("detects product by price + name", () => {
      const result = detectByShape(
        [{ name: "Widget", price: 100 }],
        "instamart",
      );
      expect(result?.type).toBe("products");
    });

    it("detects product by selling_price + name", () => {
      const result = detectByShape(
        [{ name: "Widget", selling_price: 90 }],
        "instamart",
      );
      expect(result?.type).toBe("products");
    });

    it("detects product by mrp + name", () => {
      const result = detectByShape(
        [{ name: "Widget", mrp: 120 }],
        "instamart",
      );
      expect(result?.type).toBe("products");
    });

    it("detects product by variations + name", () => {
      const result = detectByShape(
        [{ name: "Widget", variations: [] }],
        "instamart",
      );
      expect(result?.type).toBe("products");
    });

    it("detects product by defaultPrice + name", () => {
      const result = detectByShape(
        [{ name: "Dish", defaultPrice: 25000 }],
        "foodorder",
      );
      expect(result?.type).toBe("products");
    });

    it("detects product by default_price + name", () => {
      const result = detectByShape(
        [{ name: "Dish", default_price: 200 }],
        "foodorder",
      );
      expect(result?.type).toBe("products");
    });

    it("detects product by basePrice + name", () => {
      const result = detectByShape(
        [{ name: "Dish", basePrice: 150 }],
        "foodorder",
      );
      expect(result?.type).toBe("products");
    });

    it("detects product by isVeg + name", () => {
      const result = detectByShape(
        [{ name: "Paneer", isVeg: true }],
        "foodorder",
      );
      expect(result?.type).toBe("products");
    });

    it("prefers products over restaurants for foodorder when price and rating both exist", () => {
      const result = detectByShape(
        [{ name: "Aftaabi Paneer Tikka Masala", price: 369, rating: 4.4 }],
        "foodorder",
      );
      expect(result?.type).toBe("products");
    });
  });

  describe("single object wrapping", () => {
    it("wraps a single restaurant object and detects it", () => {
      const result = detectByShape(
        { name: "Solo Restaurant", cuisine: "Indian", rating: 4.0 },
        "dining",
      );
      expect(result?.type).toBe("restaurants");
    });

    it("wraps a single product object and detects it", () => {
      const result = detectByShape(
        { name: "Solo Product", price: 50 },
        "instamart",
      );
      expect(result?.type).toBe("products");
    });
  });

  describe("hasName detection with title", () => {
    it("detects name via title key", () => {
      const result = detectByShape(
        [{ title: "Named via title", price: 100 }],
        "instamart",
      );
      expect(result?.type).toBe("products");
    });
  });

  describe("time slot shapes", () => {
    it("detects time slot by time key", () => {
      const result = detectByShape(
        [{ time: "10:00 AM", available: true }],
        "dining",
      );
      expect(result?.type).toBe("time_slots");
    });

    it("detects time slot by slot key", () => {
      const result = detectByShape(
        [{ slot: "2:00 PM" }],
        "dining",
      );
      expect(result?.type).toBe("time_slots");
    });
  });

  describe("address shapes", () => {
    it("detects address by address + label keys", () => {
      const result = detectByShape(
        [{ address: "123 St", label: "Home" }],
        "instamart",
      );
      expect(result?.type).toBe("addresses");
    });

    it("detects address by addressLine + id keys", () => {
      const result = detectByShape(
        [{ addressLine: "456 Ave", id: "a1" }],
        "instamart",
      );
      expect(result?.type).toBe("addresses");
    });
  });

  describe("vertical-specific fallbacks", () => {
    it("tries restaurants then products for dining vertical", () => {
      // Object with name but no restaurant or product keys — dining tries restaurants first
      const result = detectByShape(
        [{ name: "Mystery", someField: "value" }],
        "dining",
      );
      // Both tryParseRestaurants and tryParseProducts will try but name-only won't match restaurant fields
      // tryParseProducts should succeed since it only needs a name
      expect(result?.type).toBe("products");
    });

    it("tries restaurants then products for foodorder vertical", () => {
      const result = detectByShape(
        [{ name: "Mystery", someField: "value" }],
        "foodorder",
      );
      expect(result?.type).toBe("products");
    });

    it("falls back to products for other verticals", () => {
      const result = detectByShape(
        [{ name: "Mystery", someField: "value" }],
        "instamart",
      );
      expect(result?.type).toBe("products");
    });
  });

  describe("edge cases", () => {
    it("returns null for null input", () => {
      expect(detectByShape(null, "instamart")).toBeNull();
    });

    it("returns null for empty array", () => {
      expect(detectByShape([], "instamart")).toBeNull();
    });

    it("returns null for string input", () => {
      expect(detectByShape("text", "instamart")).toBeNull();
    });

    it("returns null for number input", () => {
      expect(detectByShape(42, "instamart")).toBeNull();
    });

    it("returns null when first element is not an object", () => {
      expect(detectByShape(["string"], "instamart")).toBeNull();
    });

    it("returns null when first element is null", () => {
      expect(detectByShape([null], "instamart")).toBeNull();
    });
  });
});
