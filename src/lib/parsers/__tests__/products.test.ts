import { tryParseProducts } from "@/lib/parsers/products";

describe("tryParseProducts()", () => {
  it("parses a standard product with name, price, and image", () => {
    const result = tryParseProducts([
      {
        id: "p1",
        name: "Milk",
        price: 55,
        image: "http://img.com/milk.jpg",
      },
    ]);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("products");
    if (result!.type !== "products") return;
    expect(result!.items).toHaveLength(1);
    expect(result!.items[0]).toMatchObject({
      id: "p1",
      name: "Milk",
      price: 55,
      image: "http://img.com/milk.jpg",
    });
  });

  it("parses multiple products", () => {
    const result = tryParseProducts([
      { name: "Apple", price: 120 },
      { name: "Banana", price: 40 },
    ]);
    expect(result).not.toBeNull();
    if (result!.type !== "products") return;
    expect(result!.items).toHaveLength(2);
    expect(result!.items[0].name).toBe("Apple");
    expect(result!.items[1].name).toBe("Banana");
  });

  it("resolves name from alternative keys: displayName, product_name, title", () => {
    const r1 = tryParseProducts([{ displayName: "Widget", price: 10 }]);
    expect(r1!.type === "products" && r1!.items[0].name).toBe("Widget");

    const r2 = tryParseProducts([{ product_name: "Gadget", price: 20 }]);
    expect(r2!.type === "products" && r2!.items[0].name).toBe("Gadget");

    const r3 = tryParseProducts([{ title: "Thing", price: 30 }]);
    expect(r3!.type === "products" && r3!.items[0].name).toBe("Thing");
  });

  it("handles mrp and selling_price fields", () => {
    const result = tryParseProducts([
      { name: "Chips", selling_price: 20, mrp: 25 },
    ]);
    if (result!.type !== "products") return;
    expect(result!.items[0].price).toBe(20);
    expect(result!.items[0].mrp).toBe(25);
  });

  it("handles single variation", () => {
    const result = tryParseProducts([
      {
        name: "Coca Cola",
        variations: [
          {
            spinId: "s1",
            quantityDescription: "300ml",
            brandName: "Coca Cola",
            price: { offerPrice: 40, mrp: 45 },
            isInStockAndAvailable: true,
          },
        ],
      },
    ]);
    expect(result).not.toBeNull();
    if (result!.type !== "products") return;
    expect(result!.items).toHaveLength(1);
    expect(result!.items[0]).toMatchObject({
      name: "Coca Cola",
      price: 40,
      mrp: 45,
      quantity: "300ml",
      brand: "Coca Cola",
      available: true,
    });
  });

  it("handles multiple variations creating multiple items", () => {
    const result = tryParseProducts([
      {
        id: "p1",
        name: "Pepsi",
        variations: [
          {
            quantityDescription: "250ml",
            price: { offerPrice: 25, mrp: 30 },
          },
          {
            quantityDescription: "500ml",
            price: { offerPrice: 45, mrp: 50 },
          },
        ],
      },
    ]);
    expect(result).not.toBeNull();
    if (result!.type !== "products") return;
    expect(result!.items).toHaveLength(2);
    expect(result!.items[0].id).toBe("p1-var-0");
    expect(result!.items[0].quantity).toBe("250ml");
    expect(result!.items[0].price).toBe(25);
    expect(result!.items[1].id).toBe("p1-var-1");
    expect(result!.items[1].quantity).toBe("500ml");
    expect(result!.items[1].price).toBe(45);
  });

  it("returns null for empty array", () => {
    expect(tryParseProducts([])).toBeNull();
  });

  it("returns null for non-object/non-array input", () => {
    expect(tryParseProducts("not array")).toBeNull();
    expect(tryParseProducts(42)).toBeNull();
    expect(tryParseProducts(null)).toBeNull();
    expect(tryParseProducts(undefined)).toBeNull();
  });

  it("wraps a single product object in an array and parses it", () => {
    const result = tryParseProducts({
      name: "Single Product",
      price: 99,
      image: "img.jpg",
    });
    expect(result).not.toBeNull();
    if (result!.type !== "products") return;
    expect(result!.items).toHaveLength(1);
    expect(result!.items[0]).toMatchObject({
      name: "Single Product",
      price: 99,
      image: "img.jpg",
    });
  });

  it("skips items with missing name", () => {
    const result = tryParseProducts([
      { price: 100 },
      { name: "Valid", price: 50 },
    ]);
    expect(result).not.toBeNull();
    if (result!.type !== "products") return;
    expect(result!.items).toHaveLength(1);
    expect(result!.items[0].name).toBe("Valid");
  });

  it("returns null when all items lack names", () => {
    expect(tryParseProducts([{ price: 100 }, { price: 200 }])).toBeNull();
  });

  it("skips non-object items", () => {
    const result = tryParseProducts([
      "not an object",
      null,
      { name: "Good", price: 10 },
    ]);
    if (result!.type !== "products") return;
    expect(result!.items).toHaveLength(1);
    expect(result!.items[0].name).toBe("Good");
  });

  it("handles isAvail availability flag", () => {
    const result = tryParseProducts([{ name: "Item", isAvail: false }]);
    if (result!.type !== "products") return;
    expect(result!.items[0].available).toBe(false);
  });

  it("handles inStock availability flag", () => {
    const result = tryParseProducts([{ name: "Item", inStock: true }]);
    if (result!.type !== "products") return;
    expect(result!.items[0].available).toBe(true);
  });

  it("handles available availability flag", () => {
    const result = tryParseProducts([{ name: "Item", available: false }]);
    if (result!.type !== "products") return;
    expect(result!.items[0].available).toBe(false);
  });

  it("handles in_stock availability flag", () => {
    const result = tryParseProducts([{ name: "Item", in_stock: 0 }]);
    if (result!.type !== "products") return;
    expect(result!.items[0].available).toBe(false);
  });

  it("defaults available to true when no availability field is present", () => {
    const result = tryParseProducts([{ name: "Item", price: 10 }]);
    if (result!.type !== "products") return;
    expect(result!.items[0].available).toBe(true);
  });

  it("resolves image from alternative keys", () => {
    const r1 = tryParseProducts([{ name: "A", imageUrl: "u1" }]);
    expect(r1!.type === "products" && r1!.items[0].image).toBe("u1");

    const r2 = tryParseProducts([{ name: "A", img: "u2" }]);
    expect(r2!.type === "products" && r2!.items[0].image).toBe("u2");

    const r3 = tryParseProducts([{ name: "A", thumbnail: "u3" }]);
    expect(r3!.type === "products" && r3!.items[0].image).toBe("u3");

    const r4 = tryParseProducts([{ name: "A", image_url: "u4" }]);
    expect(r4!.type === "products" && r4!.items[0].image).toBe("u4");
  });

  it("resolves description from desc key", () => {
    const result = tryParseProducts([{ name: "A", desc: "short desc" }]);
    if (result!.type !== "products") return;
    expect(result!.items[0].description).toBe("short desc");
  });

  it("generates fallback id when id is missing", () => {
    const result = tryParseProducts([{ name: "NoId", price: 5 }]);
    if (result!.type !== "products") return;
    expect(result!.items[0].id).toBe("0");
  });

  it("resolves id from alternative keys", () => {
    const r1 = tryParseProducts([{ name: "A", productId: "pid" }]);
    expect(r1!.type === "products" && r1!.items[0].id).toBe("pid");

    const r2 = tryParseProducts([{ name: "A", product_id: "pid2" }]);
    expect(r2!.type === "products" && r2!.items[0].id).toBe("pid2");

    const r3 = tryParseProducts([{ name: "A", item_id: "iid" }]);
    expect(r3!.type === "products" && r3!.items[0].id).toBe("iid");
  });

  it("handles defaultPrice field", () => {
    const result = tryParseProducts([{ name: "Biryani", defaultPrice: 25000 }]);
    if (result!.type !== "products") return;
    // 25000 > 1000, integer → paise detection kicks in → 250
    expect(result!.items[0].price).toBe(250);
  });

  it("handles basePrice field", () => {
    const result = tryParseProducts([{ name: "Pizza", basePrice: 399 }]);
    if (result!.type !== "products") return;
    expect(result!.items[0].price).toBe(399);
  });

  it("handles finalPrice field", () => {
    const result = tryParseProducts([{ name: "Wrap", finalPrice: 150 }]);
    if (result!.type !== "products") return;
    expect(result!.items[0].price).toBe(150);
  });

  it("converts paise to rupees when all prices > 1000 and are integers", () => {
    const result = tryParseProducts([
      { name: "Item A", price: 15000 },
      { name: "Item B", price: 20000, mrp: 25000 },
    ]);
    if (result!.type !== "products") return;
    expect(result!.items[0].price).toBe(150);
    expect(result!.items[1].price).toBe(200);
    expect(result!.items[1].mrp).toBe(250);
  });

  it("does not convert prices when any price has fractional part", () => {
    const result = tryParseProducts([
      { name: "Item A", price: 1500.5 },
      { name: "Item B", price: 2000 },
    ]);
    if (result!.type !== "products") return;
    expect(result!.items[0].price).toBe(1500.5);
    expect(result!.items[1].price).toBe(2000);
  });

  it("uses isVeg as description fallback", () => {
    const r1 = tryParseProducts([{ name: "Paneer", price: 200, isVeg: true }]);
    if (r1!.type !== "products") return;
    expect(r1!.items[0].description).toBe("Veg");

    const r2 = tryParseProducts([{ name: "Chicken", price: 300, isVeg: false }]);
    if (r2!.type !== "products") return;
    expect(r2!.items[0].description).toBe("Non-Veg");
  });

  it("prefers description over isVeg fallback", () => {
    const result = tryParseProducts([
      { name: "Dish", price: 100, description: "Spicy dish", isVeg: true },
    ]);
    if (result!.type !== "products") return;
    expect(result!.items[0].description).toBe("Spicy dish");
  });

  it("builds requirement grouping metadata from explicit item type", () => {
    const result = tryParseProducts([
      { name: "Harvest Gold Bread", price: 80, item_type: "Bread" },
    ]);
    if (result!.type !== "products") return;
    expect(result.items[0].groupLabel).toBe("Bread");
    expect(result.items[0].groupKey).toBe("bread");
  });

  it("falls back to tool query for grouping metadata when explicit type is missing", () => {
    const result = tryParseProducts(
      [{ name: "Amul Butter Salted", brand: "Amul", price: 62 }],
      { toolInput: { query: "salted butter for toast" } },
    );
    if (result!.type !== "products") return;
    expect(result.items[0].sourceQuery).toBe("salted butter for toast");
    expect(result.items[0].groupLabel).toBe("Salted Butter For Toast");
    expect(result.items[0].groupKey).toBe("salted butter for toast");
  });
});
