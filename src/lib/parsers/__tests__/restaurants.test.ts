import { tryParseRestaurants } from "@/lib/parsers/restaurants";

describe("tryParseRestaurants()", () => {
  it("parses a restaurant with cuisine, rating, and offers", () => {
    const result = tryParseRestaurants([
      {
        id: "r1",
        name: "Pizza Palace",
        cuisine: "Italian",
        rating: 4.5,
        priceForTwo: "₹400",
        image: "http://img.com/pizza.jpg",
        locality: "Downtown",
        offers: ["50% off", "Free delivery"],
      },
    ]);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("restaurants");
    if (result!.type !== "restaurants") return;
    expect(result!.items).toHaveLength(1);
    expect(result!.items[0]).toMatchObject({
      id: "r1",
      name: "Pizza Palace",
      cuisine: "Italian",
      rating: 4.5,
      priceForTwo: "₹400",
      image: "http://img.com/pizza.jpg",
      locality: "Downtown",
      offers: ["50% off", "Free delivery"],
    });
  });

  it("handles cuisine as an array (joins with comma)", () => {
    const result = tryParseRestaurants([
      {
        name: "Multi Cuisine",
        cuisines: ["Indian", "Chinese", "Thai"],
        rating: 4.0,
      },
    ]);
    if (result!.type !== "restaurants") return;
    expect(result!.items[0].cuisine).toBe("Indian, Chinese, Thai");
  });

  it("handles cuisine as a string", () => {
    const result = tryParseRestaurants([
      { name: "Dosa Place", cuisine: "South Indian", rating: 4.2 },
    ]);
    if (result!.type !== "restaurants") return;
    expect(result!.items[0].cuisine).toBe("South Indian");
  });

  it("requires restaurant-like fields to qualify", () => {
    // An item with only name but no restaurant fields should be skipped
    const result = tryParseRestaurants([
      { name: "Just a Name", price: 100 },
    ]);
    expect(result).toBeNull();
  });

  it("accepts rating as a qualifying restaurant field", () => {
    const result = tryParseRestaurants([
      { name: "Rated Place", rating: 3.5 },
    ]);
    expect(result).not.toBeNull();
    if (result!.type !== "restaurants") return;
    expect(result!.items[0].rating).toBe(3.5);
  });

  it("accepts priceForTwo as a qualifying field", () => {
    const result = tryParseRestaurants([
      { name: "Budget Eats", priceForTwo: "₹200" },
    ]);
    expect(result).not.toBeNull();
    if (result!.type !== "restaurants") return;
    expect(result!.items[0].priceForTwo).toBe("₹200");
  });

  it("accepts locality as a qualifying field", () => {
    const result = tryParseRestaurants([
      { name: "Local Spot", locality: "Koramangala" },
    ]);
    expect(result).not.toBeNull();
  });

  it("accepts area and address as qualifying fields", () => {
    const r1 = tryParseRestaurants([{ name: "R", area: "HSR Layout" }]);
    expect(r1).not.toBeNull();

    const r2 = tryParseRestaurants([{ name: "R", address: "123 Main St" }]);
    expect(r2).not.toBeNull();
  });

  it("returns null for empty array", () => {
    expect(tryParseRestaurants([])).toBeNull();
  });

  it("returns null for non-array input", () => {
    expect(tryParseRestaurants("not array")).toBeNull();
    expect(tryParseRestaurants(null)).toBeNull();
    expect(tryParseRestaurants(42)).toBeNull();
  });

  it("skips items without a name", () => {
    const result = tryParseRestaurants([
      { cuisine: "Italian", rating: 4.0 },
      { name: "Named", cuisine: "Chinese", rating: 3.5 },
    ]);
    if (result!.type !== "restaurants") return;
    expect(result!.items).toHaveLength(1);
    expect(result!.items[0].name).toBe("Named");
  });

  it("resolves name from alternative keys", () => {
    const r1 = tryParseRestaurants([
      { displayName: "Display", cuisine: "Indian" },
    ]);
    expect(r1!.type === "restaurants" && r1!.items[0].name).toBe("Display");

    const r2 = tryParseRestaurants([
      { restaurant_name: "RestName", cuisine: "Indian" },
    ]);
    expect(r2!.type === "restaurants" && r2!.items[0].name).toBe("RestName");

    const r3 = tryParseRestaurants([
      { title: "Title", cuisine: "Indian" },
    ]);
    expect(r3!.type === "restaurants" && r3!.items[0].name).toBe("Title");
  });

  it("resolves id from restaurant_id", () => {
    const result = tryParseRestaurants([
      { restaurant_id: "rid", name: "R", cuisine: "Indian" },
    ]);
    if (result!.type !== "restaurants") return;
    expect(result!.items[0].id).toBe("rid");
  });

  it("generates fallback id", () => {
    const result = tryParseRestaurants([
      { name: "NoId", cuisine: "Indian" },
    ]);
    if (result!.type !== "restaurants") return;
    expect(result!.items[0].id).toBe("0");
  });

  it("handles offers as object array with title/description", () => {
    const result = tryParseRestaurants([
      {
        name: "R",
        cuisine: "Indian",
        offers: [
          { title: "20% OFF" },
          { description: "Free drink" },
        ],
      },
    ]);
    if (result!.type !== "restaurants") return;
    expect(result!.items[0].offers).toEqual(["20% OFF", "Free drink"]);
  });

  it("handles cost_for_two as priceForTwo", () => {
    const result = tryParseRestaurants([
      { name: "R", cuisine: "Indian", cost_for_two: 500 },
    ]);
    if (result!.type !== "restaurants") return;
    expect(result!.items[0].priceForTwo).toBe("₹500");
  });

  it("resolves avg_rating for rating", () => {
    const result = tryParseRestaurants([
      { name: "R", cuisine: "Indian", avg_rating: 4.1 },
    ]);
    if (result!.type !== "restaurants") return;
    expect(result!.items[0].rating).toBe(4.1);
  });

  it("resolves locality from area and location keys", () => {
    const r1 = tryParseRestaurants([
      { name: "R", cuisine: "Indian", area: "Indiranagar" },
    ]);
    if (r1!.type !== "restaurants") return;
    expect(r1!.items[0].locality).toBe("Indiranagar");

    const r2 = tryParseRestaurants([
      { name: "R", cuisine: "Indian", location: "BTM" },
    ]);
    if (r2!.type !== "restaurants") return;
    expect(r2!.items[0].locality).toBe("BTM");
  });
});
