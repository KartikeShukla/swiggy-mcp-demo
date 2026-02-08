import { str, num, numFromCurrency, asArray, scanForPrice } from "@/lib/parsers/primitives";

describe("str()", () => {
  it("returns the string for a valid non-empty string", () => {
    expect(str("hello")).toBe("hello");
  });

  it("converts a number to string", () => {
    expect(str(42)).toBe("42");
    expect(str(0)).toBe("0");
    expect(str(-3.5)).toBe("-3.5");
  });

  it("returns undefined for an empty string", () => {
    expect(str("")).toBeUndefined();
  });

  it("returns undefined for null", () => {
    expect(str(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(str(undefined)).toBeUndefined();
  });

  it("returns undefined for a boolean", () => {
    expect(str(true)).toBeUndefined();
  });

  it("returns undefined for an object", () => {
    expect(str({ foo: "bar" })).toBeUndefined();
  });

  it("returns undefined for an array", () => {
    expect(str([1, 2])).toBeUndefined();
  });
});

describe("num()", () => {
  it("returns the number for a valid number", () => {
    expect(num(42)).toBe(42);
    expect(num(0)).toBe(0);
    expect(num(-7.5)).toBe(-7.5);
  });

  it("parses a string number", () => {
    expect(num("123")).toBe(123);
    expect(num("3.14")).toBe(3.14);
    expect(num("-10")).toBe(-10);
  });

  it("returns undefined for NaN", () => {
    expect(num(NaN)).toBeUndefined();
  });

  it("returns undefined for a non-numeric string", () => {
    expect(num("abc")).toBeUndefined();
    expect(num("")).toBeUndefined();
  });

  it("returns undefined for null", () => {
    expect(num(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(num(undefined)).toBeUndefined();
  });

  it("returns undefined for a boolean", () => {
    expect(num(true)).toBeUndefined();
  });

  it("returns undefined for an object", () => {
    expect(num({ val: 1 })).toBeUndefined();
  });

  it("parses string with leading number", () => {
    // parseFloat("42px") returns 42
    expect(num("42px")).toBe(42);
  });
});

describe("numFromCurrency()", () => {
  it("parses a simple rupee amount", () => {
    expect(numFromCurrency("₹299")).toBe(299);
  });

  it("parses a rupee amount with commas and decimals", () => {
    expect(numFromCurrency("₹1,299.50")).toBe(1299.5);
  });

  it("parses a plain number string", () => {
    expect(numFromCurrency("100")).toBe(100);
  });

  it("parses amount with spaces", () => {
    expect(numFromCurrency("₹ 500")).toBe(500);
  });

  it("returns undefined for non-string input", () => {
    expect(numFromCurrency(299)).toBeUndefined();
    expect(numFromCurrency(null)).toBeUndefined();
    expect(numFromCurrency(undefined)).toBeUndefined();
  });

  it("returns undefined for non-numeric string", () => {
    expect(numFromCurrency("abc")).toBeUndefined();
  });
});

describe("asArray()", () => {
  it("returns the array for an array input", () => {
    const arr = [1, 2, 3];
    expect(asArray(arr)).toBe(arr);
  });

  it("returns an empty array for an empty array input", () => {
    expect(asArray([])).toEqual([]);
  });

  it("returns null for a string", () => {
    expect(asArray("hello")).toBeNull();
  });

  it("returns null for a number", () => {
    expect(asArray(42)).toBeNull();
  });

  it("returns null for null", () => {
    expect(asArray(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(asArray(undefined)).toBeNull();
  });

  it("returns null for an object", () => {
    expect(asArray({ length: 2 })).toBeNull();
  });
});

describe("scanForPrice()", () => {
  it("finds a price field", () => {
    expect(scanForPrice({ price: 100, name: "Test" })).toBe(100);
  });

  it("finds a cost field", () => {
    expect(scanForPrice({ cost: 250, name: "Test" })).toBe(250);
  });

  it("finds an amount field", () => {
    expect(scanForPrice({ totalAmount: 500 })).toBe(500);
  });

  it("finds an mrp field", () => {
    expect(scanForPrice({ mrp: 399 })).toBe(399);
  });

  it("returns undefined when no price-like key exists", () => {
    expect(scanForPrice({ name: "Test", quantity: 2 })).toBeUndefined();
  });

  it("skips priceForTwo field", () => {
    expect(scanForPrice({ priceForTwo: 400 })).toBeUndefined();
  });

  it("skips price_for_two field", () => {
    expect(scanForPrice({ price_for_two: 400 })).toBeUndefined();
  });

  it("handles string currency values via numFromCurrency", () => {
    expect(scanForPrice({ price: "₹299" })).toBe(299);
  });

  it("returns undefined when price is 0", () => {
    expect(scanForPrice({ price: 0 })).toBeUndefined();
  });

  it("returns undefined for an empty object", () => {
    expect(scanForPrice({})).toBeUndefined();
  });

  it("finds the first matching price-like key", () => {
    const result = scanForPrice({ sellingPrice: 100, itemCost: 200 });
    expect(result).toBe(100);
  });
});
