import {
  buildOptimisticCartKey,
  findOptimisticCartKeyById,
  findOptimisticCartKeyByName,
  type OptimisticCartEntry,
} from "@/lib/cart/optimistic-cart";

describe("optimistic cart helpers", () => {
  it("builds stable keys with vertical + restaurant + id + name", () => {
    const key = buildOptimisticCartKey(
      {
        id: "123",
        name: "Paneer Roll",
        restaurantName: "Spice Route",
      },
      {
        verticalId: "foodorder",
      },
    );

    expect(key).toBe("foodorder|spice route|123|paneer roll");
  });

  it("prefers locked restaurant scope over product restaurant", () => {
    const key = buildOptimisticCartKey(
      {
        id: "123",
        name: "Paneer Roll",
        restaurantName: "Old Scope",
      },
      {
        verticalId: "foodorder",
        lockedRestaurant: "New Scope",
      },
    );

    expect(key).toBe("foodorder|new scope|123|paneer roll");
  });

  it("finds exact-name match in requested restaurant scope", () => {
    const entries: Record<string, OptimisticCartEntry> = {
      "k-1": {
        id: "1",
        name: "Paneer Roll",
        price: 200,
        quantity: 1,
        restaurantScope: "spice route",
        updatedAt: 1,
      },
      "k-2": {
        id: "2",
        name: "Paneer Roll",
        price: 180,
        quantity: 1,
        restaurantScope: "curry house",
        updatedAt: 2,
      },
    };

    const key = findOptimisticCartKeyByName(entries, "Paneer Roll", "Curry House");
    expect(key).toBe("k-2");
  });

  it("falls back to latest updated match when scope missing", () => {
    const entries: Record<string, OptimisticCartEntry> = {
      "k-1": {
        id: "1",
        name: "Paneer Roll",
        price: 200,
        quantity: 1,
        updatedAt: 10,
      },
      "k-2": {
        id: "2",
        name: "Paneer Roll",
        price: 180,
        quantity: 1,
        updatedAt: 20,
      },
    };

    const key = findOptimisticCartKeyByName(entries, "Paneer Roll");
    expect(key).toBe("k-2");
  });

  it("finds exact-id match scoped by restaurant", () => {
    const entries: Record<string, OptimisticCartEntry> = {
      "k-1": {
        id: "i1",
        name: "Paneer Roll",
        price: 200,
        quantity: 1,
        restaurantScope: "spice route",
        updatedAt: 5,
      },
      "k-2": {
        id: "i1",
        name: "Paneer Roll",
        price: 220,
        quantity: 2,
        restaurantScope: "curry house",
        updatedAt: 10,
      },
    };

    const key = findOptimisticCartKeyById(entries, "i1", "spice route");
    expect(key).toBe("k-1");
  });
});
