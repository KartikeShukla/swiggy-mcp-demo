import { tryParseAddresses } from "@/lib/parsers/addresses";

describe("tryParseAddresses()", () => {
  it("parses addresses with label, address, lat, and lng", () => {
    const result = tryParseAddresses([
      {
        id: "a1",
        label: "Home",
        address: "123 Main St, City",
        lat: 12.9716,
        lng: 77.5946,
      },
    ]);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("addresses");
    if (result!.type !== "addresses") return;
    expect(result!.addresses).toHaveLength(1);
    expect(result!.addresses[0]).toMatchObject({
      id: "a1",
      label: "Home",
      address: "123 Main St, City",
      lat: 12.9716,
      lng: 77.5946,
    });
  });

  it("defaults label to 'Address' when no label key is found", () => {
    const result = tryParseAddresses([
      { address: "456 Oak Ave" },
    ]);
    if (result!.type !== "addresses") return;
    expect(result!.addresses[0].label).toBe("Address");
  });

  it("resolves label from type key", () => {
    const result = tryParseAddresses([
      { address: "789 Pine Rd", type: "Office" },
    ]);
    if (result!.type !== "addresses") return;
    expect(result!.addresses[0].label).toBe("Office");
  });

  it("resolves label from tag key", () => {
    const result = tryParseAddresses([
      { address: "101 Elm Blvd", tag: "Work" },
    ]);
    if (result!.type !== "addresses") return;
    expect(result!.addresses[0].label).toBe("Work");
  });

  it("resolves label from annotation key", () => {
    const result = tryParseAddresses([
      { address: "202 Cedar Ln", annotation: "Gym" },
    ]);
    if (result!.type !== "addresses") return;
    expect(result!.addresses[0].label).toBe("Gym");
  });

  it("resolves label from category key", () => {
    const result = tryParseAddresses([
      { address: "303 Birch Way", category: "Friend" },
    ]);
    if (result!.type !== "addresses") return;
    expect(result!.addresses[0].label).toBe("Friend");
  });

  it("resolves address from addressLine key", () => {
    const result = tryParseAddresses([
      { addressLine: "555 Maple Dr" },
    ]);
    if (result!.type !== "addresses") return;
    expect(result!.addresses[0].address).toBe("555 Maple Dr");
  });

  it("resolves address from full_address key", () => {
    const result = tryParseAddresses([
      { full_address: "666 Walnut Ct" },
    ]);
    if (result!.type !== "addresses") return;
    expect(result!.addresses[0].address).toBe("666 Walnut Ct");
  });

  it("resolves address from formatted_address key", () => {
    const result = tryParseAddresses([
      { formatted_address: "777 Cherry Pl" },
    ]);
    if (result!.type !== "addresses") return;
    expect(result!.addresses[0].address).toBe("777 Cherry Pl");
  });

  it("resolves lat/lng from latitude/longitude keys", () => {
    const result = tryParseAddresses([
      { address: "Test St", latitude: 28.7041, longitude: 77.1025 },
    ]);
    if (result!.type !== "addresses") return;
    expect(result!.addresses[0].lat).toBe(28.7041);
    expect(result!.addresses[0].lng).toBe(77.1025);
  });

  it("returns null for empty array", () => {
    expect(tryParseAddresses([])).toBeNull();
  });

  it("returns null for non-object/non-array input", () => {
    expect(tryParseAddresses("not array")).toBeNull();
    expect(tryParseAddresses(null)).toBeNull();
    expect(tryParseAddresses(42)).toBeNull();
  });

  it("wraps a single address object and parses it", () => {
    const result = tryParseAddresses({ address: "test" });
    expect(result).not.toBeNull();
    if (result!.type !== "addresses") return;
    expect(result!.addresses).toHaveLength(1);
    expect(result!.addresses[0].address).toBe("test");
  });

  it("skips items without a recognized address key", () => {
    const result = tryParseAddresses([
      { label: "Home", city: "Bangalore" },
      { address: "Real Address" },
    ]);
    if (result!.type !== "addresses") return;
    expect(result!.addresses).toHaveLength(1);
    expect(result!.addresses[0].address).toBe("Real Address");
  });

  it("returns null when all items lack address fields", () => {
    expect(tryParseAddresses([{ name: "No Address" }])).toBeNull();
  });

  it("resolves id from address_id key", () => {
    const result = tryParseAddresses([
      { address_id: "aid1", address: "Test" },
    ]);
    if (result!.type !== "addresses") return;
    expect(result!.addresses[0].id).toBe("aid1");
  });

  it("generates fallback id when no id key is present", () => {
    const result = tryParseAddresses([{ address: "Test" }]);
    if (result!.type !== "addresses") return;
    expect(result!.addresses[0].id).toBe("0");
  });

  it("parses multiple addresses", () => {
    const result = tryParseAddresses([
      { id: "1", label: "Home", address: "Addr 1" },
      { id: "2", label: "Work", address: "Addr 2" },
    ]);
    if (result!.type !== "addresses") return;
    expect(result!.addresses).toHaveLength(2);
  });
});
