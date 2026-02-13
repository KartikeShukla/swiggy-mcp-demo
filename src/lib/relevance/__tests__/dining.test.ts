import {
  extractDiningConstraints,
  rerankDiningRestaurants,
  shouldAllowDiningBroadening,
} from "@/lib/relevance/dining";
import type { ParsedRestaurant, ToolRenderContext } from "@/lib/types";

describe("dining relevance", () => {
  it("extracts strict-first dining constraints including dish-to-cuisine proxy", () => {
    const constraints = extractDiningConstraints(
      "Need dosa dinner in Koramangala for 2 under 1200 tonight",
    );

    expect(constraints.dishes).toContain("dosa");
    expect(constraints.cuisines).toContain("south indian");
    expect(constraints.areas).toContain("koramangala");
    expect(constraints.budgetMax).toBe(1200);
    expect(constraints.partySize).toBe(2);
    expect(constraints.timeHints).toEqual(expect.arrayContaining(["tonight", "dinner"]));
  });

  it("captures sunday time hint and avoids leaking it into parsed area", () => {
    const constraints = extractDiningConstraints(
      "South Indian in Koramangala Sunday dinner for 2",
    );

    expect(constraints.areas).toContain("koramangala");
    expect(constraints.areas).not.toContain("koramangala sunday");
    expect(constraints.timeHints).toEqual(expect.arrayContaining(["sunday", "dinner"]));
  });

  it("prioritizes strict cuisine + area matches over higher-rated loose matches", () => {
    const restaurants: ParsedRestaurant[] = [
      { id: "r1", name: "Trattoria Bella", cuisine: "Italian", locality: "Koramangala", rating: 4.8 },
      { id: "r2", name: "Andhra Spice Court", cuisine: "South Indian", locality: "Indiranagar", rating: 4.4 },
      { id: "r3", name: "Udupi Corner", cuisine: "South Indian", locality: "Koramangala", rating: 4.2 },
    ];

    const context: ToolRenderContext = {
      verticalId: "dining",
      mode: "discover",
      latestUserQuery: "south indian dinner in koramangala",
      strictConstraints: extractDiningConstraints("south indian dinner in koramangala"),
      allowConstraintBroadening: false,
    };

    const result = rerankDiningRestaurants(restaurants, context);
    expect(result.requireBroadenPrompt).toBe(false);
    expect(result.items[0]?.name).toBe("Udupi Corner");
  });

  it("returns broaden prompt when strict filters conflict and no combined match exists", () => {
    const restaurants: ParsedRestaurant[] = [
      { id: "r1", name: "Roma House", cuisine: "Italian", locality: "Indiranagar", rating: 4.4, priceForTwo: "₹900" },
      { id: "r2", name: "Spice Court", cuisine: "North Indian", locality: "Whitefield", rating: 4.3, priceForTwo: "₹800" },
    ];

    const context: ToolRenderContext = {
      verticalId: "dining",
      mode: "discover",
      latestUserQuery: "romantic italian in whitefield under 1000",
      strictConstraints: extractDiningConstraints("romantic italian in whitefield under 1000"),
      allowConstraintBroadening: false,
    };

    const result = rerankDiningRestaurants(restaurants, context);
    expect(result.requireBroadenPrompt).toBe(true);
    expect(result.items).toHaveLength(0);
  });

  it("relaxes ranking only after explicit broadening intent", () => {
    expect(shouldAllowDiningBroadening("broaden results, show more options")).toBe(true);

    const restaurants: ParsedRestaurant[] = [
      { id: "r1", name: "Roma House", cuisine: "Italian", locality: "Indiranagar", rating: 4.4, priceForTwo: "₹900" },
      { id: "r2", name: "Spice Court", cuisine: "North Indian", locality: "Whitefield", rating: 4.3, priceForTwo: "₹800" },
    ];

    const context: ToolRenderContext = {
      verticalId: "dining",
      mode: "discover",
      latestUserQuery: "romantic italian in whitefield under 1000, broaden results",
      strictConstraints: extractDiningConstraints("romantic italian in whitefield under 1000"),
      allowConstraintBroadening: true,
    };

    const result = rerankDiningRestaurants(restaurants, context);
    expect(result.requireBroadenPrompt).toBe(false);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.debug.note).toContain("Relaxed ranking");
  });
});
