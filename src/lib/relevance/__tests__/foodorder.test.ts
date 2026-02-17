import {
  extractFoodorderConstraints,
  rerankFoodorderMenuItems,
  rerankFoodorderRestaurants,
  shouldAllowBroadening,
} from "@/lib/relevance/foodorder";
import type { ParsedProduct, ParsedRestaurant, ToolRenderContext } from "@/lib/types";

describe("foodorder relevance", () => {
  it("extracts strict-first constraint signals", () => {
    const constraints = extractFoodorderConstraints(
      "I want spicy south indian dosa under 300",
    );
    expect(constraints.cuisines).toEqual(["south indian"]);
    expect(constraints.dishes).toEqual(["dosa"]);
    expect(constraints.spicy).toBe(true);
    expect(constraints.budgetMax).toBe(300);
  });

  it("prioritizes strict restaurant matches for cuisine intent", () => {
    const restaurants: ParsedRestaurant[] = [
      { id: "r1", name: "Punjabi Rasoi", cuisine: "North Indian", rating: 4.3 },
      { id: "r2", name: "Andhra Spice Hub", cuisine: "South Indian", rating: 4.1 },
      { id: "r3", name: "Pizza Planet", cuisine: "Italian", rating: 4.4 },
    ];
    const context: ToolRenderContext = {
      verticalId: "foodorder",
      mode: "discover",
      latestUserQuery: "spicy south indian food",
      strictConstraints: extractFoodorderConstraints("spicy south indian food"),
      allowConstraintBroadening: false,
    };

    const result = rerankFoodorderRestaurants(restaurants, context);
    expect(result.requireBroadenPrompt).toBe(false);
    expect(result.items[0]?.name).toBe("Andhra Spice Hub");
  });

  it("returns broaden prompt when strict menu constraints have no match", () => {
    const menu: ParsedProduct[] = [
      { id: "m1", name: "Paneer Butter Masala", price: 280, description: "Veg" },
      { id: "m2", name: "Veg Fried Rice", price: 220, description: "Veg" },
    ];
    const context: ToolRenderContext = {
      verticalId: "foodorder",
      mode: "menu",
      latestUserQuery: "I want dosa",
      strictConstraints: extractFoodorderConstraints("I want dosa"),
      allowConstraintBroadening: false,
    };

    const result = rerankFoodorderMenuItems(menu, context);
    expect(result.requireBroadenPrompt).toBe(true);
    expect(result.items).toHaveLength(0);
  });

  it("uses broadening signal when user explicitly asks for wider options", () => {
    expect(shouldAllowBroadening("broaden results, show anything")).toBe(true);

    const menu: ParsedProduct[] = [
      { id: "m1", name: "Paneer Butter Masala", price: 280, description: "Veg" },
      { id: "m2", name: "Veg Fried Rice", price: 220, description: "Veg" },
    ];
    const context: ToolRenderContext = {
      verticalId: "foodorder",
      mode: "menu",
      latestUserQuery: "dosa, but broaden results",
      strictConstraints: extractFoodorderConstraints("dosa"),
      allowConstraintBroadening: true,
    };

    const result = rerankFoodorderMenuItems(menu, context);
    expect(result.requireBroadenPrompt).toBe(false);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("honors locked restaurant context when menu items contain restaurant names", () => {
    const menu: ParsedProduct[] = [
      { id: "m1", name: "Masala Dosa", restaurantName: "South Spice", price: 190 },
      { id: "m2", name: "Masala Dosa", restaurantName: "Random Curry", price: 160 },
    ];
    const context: ToolRenderContext = {
      verticalId: "foodorder",
      mode: "menu",
      latestUserQuery: "dosa",
      lockedRestaurant: "South Spice",
      strictConstraints: extractFoodorderConstraints("dosa"),
      allowConstraintBroadening: false,
    };

    const result = rerankFoodorderMenuItems(menu, context);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].restaurantName).toBe("South Spice");
  });
});
