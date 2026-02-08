import { parseVariantsFromText } from "@/lib/parsers/variants-text";

describe("parseVariantsFromText()", () => {
  it("parses a single product with variants in **Product** \\n - Variant @ price pattern", () => {
    const text = `**Coca Cola**
- 300ml @ ₹40
- 500ml @ ₹65
- 1L @ ₹99
`;
    const result = parseVariantsFromText(text);
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].type).toBe("products");
    if (result.segments[0].type !== "products") return;
    expect(result.segments[0].items).toHaveLength(3);
    expect(result.segments[0].items[0]).toMatchObject({
      name: "Coca Cola",
      price: 40,
      quantity: "300ml",
      available: true,
    });
    expect(result.segments[0].items[1]).toMatchObject({
      name: "Coca Cola",
      price: 65,
      quantity: "500ml",
    });
    expect(result.segments[0].items[2]).toMatchObject({
      name: "Coca Cola",
      price: 99,
      quantity: "1L",
    });
  });

  it("returns single text segment if no products found", () => {
    const text = "This is just plain text with no product patterns.";
    const result = parseVariantsFromText(text);
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].type).toBe("text");
    if (result.segments[0].type !== "text") return;
    expect(result.segments[0].content).toBe(text);
  });

  it("handles mixed text and product blocks", () => {
    const text = `Here are some options:

**Pepsi**
- 250ml @ ₹25
- 500ml @ ₹45

Let me know which one you'd like!`;
    const result = parseVariantsFromText(text);
    expect(result.segments.length).toBeGreaterThanOrEqual(2);

    // First segment should be the intro text
    expect(result.segments[0].type).toBe("text");

    // Second should be products
    const productSegment = result.segments.find((s) => s.type === "products");
    expect(productSegment).toBeDefined();
    if (productSegment?.type !== "products") return;
    expect(productSegment.items).toHaveLength(2);
    expect(productSegment.items[0].name).toBe("Pepsi");

    // Last segment should be trailing text
    const lastSegment = result.segments[result.segments.length - 1];
    expect(lastSegment.type).toBe("text");
  });

  it("handles multiple product blocks", () => {
    const text = `**Milk**
- 500ml @ ₹30
- 1L @ ₹55

**Bread**
- White @ ₹40
- Brown @ ₹50
`;
    const result = parseVariantsFromText(text);
    const productSegments = result.segments.filter((s) => s.type === "products");
    expect(productSegments).toHaveLength(2);

    if (productSegments[0].type !== "products" || productSegments[1].type !== "products") return;
    expect(productSegments[0].items[0].name).toBe("Milk");
    expect(productSegments[1].items[0].name).toBe("Bread");
  });

  it("handles Rs. currency format", () => {
    const text = `**Chips**
- Small @ Rs.20
- Large @ Rs.35
`;
    const result = parseVariantsFromText(text);
    const productSegment = result.segments.find((s) => s.type === "products");
    expect(productSegment).toBeDefined();
    if (productSegment?.type !== "products") return;
    expect(productSegment.items[0].price).toBe(20);
    expect(productSegment.items[1].price).toBe(35);
  });

  it("handles price with commas", () => {
    const text = `**Premium Item**
- Pack of 6 @ ₹1,299
`;
    const result = parseVariantsFromText(text);
    const productSegment = result.segments.find((s) => s.type === "products");
    if (productSegment?.type !== "products") return;
    expect(productSegment.items[0].price).toBe(1299);
  });

  it("handles price with decimal", () => {
    const text = `**Item**
- Small @ ₹99.50
`;
    const result = parseVariantsFromText(text);
    const productSegment = result.segments.find((s) => s.type === "products");
    if (productSegment?.type !== "products") return;
    expect(productSegment.items[0].price).toBe(99.5);
  });

  it("handles bullet point variants with * marker", () => {
    const text = `**Juice**
* 200ml @ ₹25
* 500ml @ ₹55
`;
    const result = parseVariantsFromText(text);
    const productSegment = result.segments.find((s) => s.type === "products");
    if (productSegment?.type !== "products") return;
    expect(productSegment.items).toHaveLength(2);
  });

  it("skips variant lines without price pattern", () => {
    const text = `**Product**
- Variant A @ ₹100
- Variant B (out of stock)
- Variant C @ ₹150
`;
    const result = parseVariantsFromText(text);
    const productSegment = result.segments.find((s) => s.type === "products");
    if (productSegment?.type !== "products") return;
    // Only lines with @ ₹ pattern should be parsed
    expect(productSegment.items).toHaveLength(2);
    expect(productSegment.items[0].quantity).toBe("Variant A");
    expect(productSegment.items[1].quantity).toBe("Variant C");
  });

  it("generates unique ids for each variant", () => {
    const text = `**Cola**
- 300ml @ ₹40
- 500ml @ ₹65
`;
    const result = parseVariantsFromText(text);
    if (result.segments[0].type !== "products") return;
    const ids = result.segments[0].items.map((i) => i.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("sets available=true for all parsed variants", () => {
    const text = `**Drink**
- Small @ ₹20
- Large @ ₹35
`;
    const result = parseVariantsFromText(text);
    if (result.segments[0].type !== "products") return;
    for (const item of result.segments[0].items) {
      expect(item.available).toBe(true);
    }
  });

  it("handles product name with colon", () => {
    const text = `**Product: Special Edition**
- Version A @ ₹199
`;
    const result = parseVariantsFromText(text);
    const productSegment = result.segments.find((s) => s.type === "products");
    if (productSegment?.type !== "products") return;
    expect(productSegment.items[0].name).toBe("Product: Special Edition");
  });

  it("handles empty text", () => {
    const result = parseVariantsFromText("");
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].type).toBe("text");
    if (result.segments[0].type !== "text") return;
    expect(result.segments[0].content).toBe("");
  });

  it("does not treat bold text without variant lines as product", () => {
    const text = "This has **bold text** but no variant lines after it.";
    const result = parseVariantsFromText(text);
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].type).toBe("text");
  });
});
