import { tryParseInfo } from "@/lib/parsers/info";

describe("tryParseInfo()", () => {
  it("extracts title from name key", () => {
    const result = tryParseInfo({ name: "John Doe", age: 30 });
    expect(result).not.toBeNull();
    expect(result!.type).toBe("info");
    if (result!.type !== "info") return;
    expect(result!.title).toBe("John Doe");
  });

  it("extracts title from title key", () => {
    const result = tryParseInfo({ title: "My Title", value: 42 });
    if (result!.type !== "info") return;
    expect(result!.title).toBe("My Title");
  });

  it("extracts title from label key", () => {
    const result = tryParseInfo({ label: "My Label", data: "xyz" });
    if (result!.type !== "info") return;
    expect(result!.title).toBe("My Label");
  });

  it("defaults title to 'Details' when no name/title/label", () => {
    const result = tryParseInfo({ foo: "bar", baz: 123 });
    if (result!.type !== "info") return;
    expect(result!.title).toBe("Details");
  });

  it("converts keys with humanizeKey", () => {
    const result = tryParseInfo({ firstName: "Jane", last_name: "Doe" });
    if (result!.type !== "info") return;
    const keys = result!.entries.map((e) => e.key);
    expect(keys).toContain("First Name");
    expect(keys).toContain("Last Name");
  });

  it("stringifies various value types", () => {
    const result = tryParseInfo({
      str: "hello",
      num: 42,
      bool: true,
      arr: [1, 2],
      obj: { a: 1 },
    });
    if (result!.type !== "info") return;
    const entryMap = Object.fromEntries(result!.entries.map((e) => [e.key, e.value]));
    expect(entryMap["Str"]).toBe("hello");
    expect(entryMap["Num"]).toBe("42");
    expect(entryMap["Bool"]).toBe("true");
    expect(entryMap["Arr"]).toBe("1, 2");
    expect(entryMap["Obj"]).toBe('{"a":1}');
  });

  it("skips null and undefined values", () => {
    const result = tryParseInfo({ a: "valid", b: null, c: undefined });
    if (result!.type !== "info") return;
    const keys = result!.entries.map((e) => e.key);
    expect(keys).toContain("A");
    expect(keys).not.toContain("B");
    expect(keys).not.toContain("C");
  });

  it("returns null for empty objects", () => {
    expect(tryParseInfo({})).toBeNull();
  });

  it("returns null for arrays", () => {
    expect(tryParseInfo([{ name: "test" }])).toBeNull();
  });

  it("returns null for null", () => {
    expect(tryParseInfo(null)).toBeNull();
  });

  it("returns null for non-objects", () => {
    expect(tryParseInfo("string")).toBeNull();
    expect(tryParseInfo(42)).toBeNull();
    expect(tryParseInfo(undefined)).toBeNull();
  });

  it("returns null when all values are null", () => {
    // stringifyValue returns "" for null, which is falsy, so entries skipped
    expect(tryParseInfo({ a: null, b: null })).toBeNull();
  });

  it("includes all keys as entries", () => {
    const result = tryParseInfo({ name: "Test", x: 1, y: 2, z: 3 });
    if (result!.type !== "info") return;
    // name is included as an entry too (it is iterated over)
    expect(result!.entries.length).toBe(4);
  });

  it("handles hyphenated keys", () => {
    const result = tryParseInfo({ "delivery-time": "30 mins" });
    if (result!.type !== "info") return;
    expect(result!.entries[0].key).toBe("Delivery Time");
  });
});
