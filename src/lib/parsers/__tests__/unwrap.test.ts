import { unwrapContent, extractPayload, tryParseJSON, flattenCategoryItems } from "@/lib/parsers/unwrap";

describe("tryParseJSON()", () => {
  it("parses valid JSON object", () => {
    expect(tryParseJSON('{"key":"value"}')).toEqual({ key: "value" });
  });

  it("parses valid JSON array", () => {
    expect(tryParseJSON("[1,2,3]")).toEqual([1, 2, 3]);
  });

  it("parses JSON number", () => {
    expect(tryParseJSON("42")).toBe(42);
  });

  it("parses JSON string", () => {
    expect(tryParseJSON('"hello"')).toBe("hello");
  });

  it("returns the original string for invalid JSON", () => {
    expect(tryParseJSON("not json")).toBe("not json");
  });

  it("returns the original string for malformed JSON", () => {
    expect(tryParseJSON("{bad}")).toBe("{bad}");
  });

  it("returns empty string for empty string input", () => {
    expect(tryParseJSON("")).toBe("");
  });
});

describe("unwrapContent()", () => {
  it("unwraps BetaTextBlock array with JSON text", () => {
    const content = [
      { type: "text", text: '{"items": [1,2]}', citations: null },
    ];
    expect(unwrapContent(content)).toEqual({ items: [1, 2] });
  });

  it("combines multiple BetaTextBlock entries", () => {
    const content = [
      { type: "text", text: '{"a":', citations: null },
      { type: "text", text: '"b"}', citations: null },
    ];
    // Combined text is '{"a":\n"b"}' which is valid JSON
    expect(unwrapContent(content)).toEqual({ a: "b" });
  });

  it("ignores non-text items in the array", () => {
    const content = [
      { type: "image", url: "http://example.com/img.png" },
      { type: "text", text: '"hello"', citations: null },
    ];
    expect(unwrapContent(content)).toBe("hello");
  });

  it("returns the array as-is when no text blocks found", () => {
    const content = [{ type: "image", url: "http://example.com/img.png" }];
    expect(unwrapContent(content)).toEqual(content);
  });

  it("parses a JSON string directly", () => {
    expect(unwrapContent('{"key":"val"}')).toEqual({ key: "val" });
  });

  it("returns plain string if not valid JSON", () => {
    expect(unwrapContent("just text")).toBe("just text");
  });

  it("passes through objects unchanged", () => {
    const obj = { foo: "bar" };
    expect(unwrapContent(obj)).toBe(obj);
  });

  it("passes through numbers unchanged", () => {
    expect(unwrapContent(42)).toBe(42);
  });

  it("passes through null unchanged", () => {
    expect(unwrapContent(null)).toBeNull();
  });

  it("handles empty array (no text blocks)", () => {
    expect(unwrapContent([])).toEqual([]);
  });
});

describe("extractPayload()", () => {
  it("extracts nested data key", () => {
    expect(extractPayload({ data: [1, 2, 3] })).toEqual([1, 2, 3]);
  });

  it("extracts nested results key", () => {
    expect(extractPayload({ results: [4, 5] })).toEqual([4, 5]);
  });

  it("extracts nested items key", () => {
    expect(extractPayload({ items: [{ name: "A" }] })).toEqual([
      { name: "A" },
    ]);
  });

  it("extracts nested products key", () => {
    expect(extractPayload({ products: [{ id: "1" }] })).toEqual([
      { id: "1" },
    ]);
  });

  it("extracts nested restaurants key", () => {
    expect(extractPayload({ restaurants: [{ name: "R1" }] })).toEqual([
      { name: "R1" },
    ]);
  });

  it("extracts nested menu key", () => {
    expect(extractPayload({ menu: [{ name: "Dish" }] })).toEqual([
      { name: "Dish" },
    ]);
  });

  it("extracts nested dishes key", () => {
    expect(extractPayload({ dishes: [{ name: "Naan" }] })).toEqual([
      { name: "Naan" },
    ]);
  });

  it("extracts nested addresses key", () => {
    expect(extractPayload({ addresses: [{ address: "123 St" }] })).toEqual([
      { address: "123 St" },
    ]);
  });

  it("extracts nested cart key (object with items)", () => {
    const payload = { cart: { items: [{ name: "X" }] } };
    // cart is not null, recurse into cart -> then items is array -> return it
    expect(extractPayload(payload)).toEqual([{ name: "X" }]);
  });

  it("extracts nested slots key", () => {
    expect(extractPayload({ slots: ["10am", "11am"] })).toEqual([
      "10am",
      "11am",
    ]);
  });

  it("recurses through multiple levels: data > items", () => {
    const payload = { data: { items: [1, 2] } };
    expect(extractPayload(payload)).toEqual([1, 2]);
  });

  it("stops at max depth and returns content as-is", () => {
    // PAYLOAD_EXTRACT_MAX_DEPTH is 2
    // depth 0: obj with data -> recurse (depth 1)
    // depth 1: obj with results -> recurse (depth 2)
    // depth 2: obj with items -> recurse (depth 3)
    // depth 3: > max depth (2), return content
    const payload = {
      data: { results: { items: [1, 2] } },
    };
    expect(extractPayload(payload)).toEqual([1, 2]);
  });

  it("returns array directly without unwrapping", () => {
    const arr = [1, 2, 3];
    expect(extractPayload(arr)).toBe(arr);
  });

  it("returns the object if no known keys are found", () => {
    const obj = { foo: "bar", baz: 42 };
    expect(extractPayload(obj)).toBe(obj);
  });

  it("returns primitive values as-is", () => {
    expect(extractPayload("hello")).toBe("hello");
    expect(extractPayload(42)).toBe(42);
    expect(extractPayload(null)).toBeNull();
  });

  it("prioritizes data over results (first matching key wins)", () => {
    const payload = { data: [1], results: [2] };
    expect(extractPayload(payload)).toEqual([1]);
  });

  it("skips null values for known keys", () => {
    const payload = { data: null, results: [5, 6] };
    expect(extractPayload(payload)).toEqual([5, 6]);
  });

  it("extracts nested menu_items key", () => {
    expect(extractPayload({ menu_items: [{ name: "A" }] })).toEqual([{ name: "A" }]);
  });

  it("extracts nested menu_categories key", () => {
    expect(extractPayload({ menu_categories: [{ name: "Cat" }] })).toEqual([{ name: "Cat" }]);
  });

  it("extracts nested listings key", () => {
    expect(extractPayload({ listings: [{ name: "L" }] })).toEqual([{ name: "L" }]);
  });

  it("extracts nested options key", () => {
    expect(extractPayload({ options: [{ name: "O" }] })).toEqual([{ name: "O" }]);
  });

  it("flattens categories with nested items", () => {
    const payload = {
      categories: [
        { name: "Starters", items: [{ name: "Spring Roll" }, { name: "Soup" }] },
        { name: "Mains", items: [{ name: "Biryani" }] },
      ],
    };
    const result = extractPayload(payload);
    expect(result).toEqual([
      { name: "Spring Roll" },
      { name: "Soup" },
      { name: "Biryani" },
    ]);
  });

  it("flattens categories with dishes sub-arrays", () => {
    const payload = {
      categories: [
        { name: "Appetizers", dishes: [{ name: "Samosa" }] },
      ],
    };
    const result = extractPayload(payload);
    expect(result).toEqual([{ name: "Samosa" }]);
  });

  it("unwraps Swiggy-style double-nested card.info in categories", () => {
    const payload = {
      categories: [
        {
          name: "Recommended",
          itemCards: [
            { card: { info: { name: "Butter Chicken", price: 350 } } },
            { card: { info: { name: "Dal Makhani", price: 250 } } },
          ],
        },
      ],
    };
    const result = extractPayload(payload);
    expect(result).toEqual([
      { name: "Butter Chicken", price: 350 },
      { name: "Dal Makhani", price: 250 },
    ]);
  });

  it("returns object as-is when categories has no sub-items", () => {
    const payload = {
      categories: [
        { name: "Empty Category" },
      ],
    };
    expect(extractPayload(payload)).toBe(payload);
  });
});

describe("flattenCategoryItems()", () => {
  it("flattens items from multiple categories", () => {
    const result = flattenCategoryItems([
      { name: "Cat1", items: [{ name: "A" }, { name: "B" }] },
      { name: "Cat2", items: [{ name: "C" }] },
    ]);
    expect(result).toEqual([{ name: "A" }, { name: "B" }, { name: "C" }]);
  });

  it("handles dishes key", () => {
    const result = flattenCategoryItems([
      { name: "Cat", dishes: [{ name: "D" }] },
    ]);
    expect(result).toEqual([{ name: "D" }]);
  });

  it("handles itemCards key", () => {
    const result = flattenCategoryItems([
      { name: "Cat", itemCards: [{ name: "I" }] },
    ]);
    expect(result).toEqual([{ name: "I" }]);
  });

  it("handles products key", () => {
    const result = flattenCategoryItems([
      { name: "Cat", products: [{ name: "P" }] },
    ]);
    expect(result).toEqual([{ name: "P" }]);
  });

  it("unwraps card.info nested items", () => {
    const result = flattenCategoryItems([
      {
        name: "Cat",
        itemCards: [
          { card: { info: { name: "Unwrapped" } } },
        ],
      },
    ]);
    expect(result).toEqual([{ name: "Unwrapped" }]);
  });

  it("skips non-object categories", () => {
    const result = flattenCategoryItems(["string", null, 42]);
    expect(result).toEqual([]);
  });

  it("skips categories without item sub-arrays", () => {
    const result = flattenCategoryItems([
      { name: "Empty" },
    ]);
    expect(result).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(flattenCategoryItems([])).toEqual([]);
  });
});
