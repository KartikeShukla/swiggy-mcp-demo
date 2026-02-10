import { tryParseCart, buildCartFromItems, parseCartItems } from "@/lib/parsers/cart";

describe("parseCartItems()", () => {
  it("parses a basic cart item", () => {
    const items = parseCartItems([
      { name: "Milk", price: 55, quantity: 2 },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      name: "Milk",
      price: 55,
      quantity: 2,
    });
  });

  it("defaults quantity to 1 when not provided", () => {
    const items = parseCartItems([{ name: "Bread", price: 30 }]);
    expect(items[0].quantity).toBe(1);
  });

  it("skips items without a name", () => {
    const items = parseCartItems([{ price: 100 }, { name: "Valid", price: 50 }]);
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("Valid");
  });

  it("skips non-object items", () => {
    const items = parseCartItems(["string", null, undefined, 42, { name: "OK", price: 10 }]);
    expect(items).toHaveLength(1);
  });

  it("resolves name from alternative keys", () => {
    expect(parseCartItems([{ displayName: "A", price: 1 }])[0].name).toBe("A");
    expect(parseCartItems([{ product_name: "B", price: 1 }])[0].name).toBe("B");
    expect(parseCartItems([{ title: "C", price: 1 }])[0].name).toBe("C");
    expect(parseCartItems([{ itemName: "D", price: 1 }])[0].name).toBe("D");
    expect(parseCartItems([{ item_name: "E", price: 1 }])[0].name).toBe("E");
  });

  it("resolves quantity from qty and count keys", () => {
    expect(parseCartItems([{ name: "A", price: 1, qty: 3 }])[0].quantity).toBe(3);
    expect(parseCartItems([{ name: "A", price: 1, count: 5 }])[0].quantity).toBe(5);
  });

  it("handles currency string for price via numFromCurrency", () => {
    const items = parseCartItems([{ name: "Item", price: "₹299" }]);
    expect(items[0].price).toBe(299);
  });

  it("falls back to 0 when no price field is found", () => {
    const items = parseCartItems([{ name: "NoPriceItem" }]);
    expect(items[0].price).toBe(0);
  });

  it("resolves price from nested price object with offerPrice", () => {
    const items = parseCartItems([
      { name: "Item", price: { offerPrice: 100, mrp: 120 } },
    ]);
    expect(items[0].price).toBe(100);
  });

  it("resolves price from effectiveItemPrice", () => {
    const items = parseCartItems([
      { name: "Item", effectiveItemPrice: 150 },
    ]);
    expect(items[0].price).toBe(150);
  });

  it("resolves price from variation price", () => {
    const items = parseCartItems([
      {
        name: "Item",
        variations: [{ price: { offerPrice: 80 } }],
      },
    ]);
    expect(items[0].price).toBe(80);
  });
});

describe("buildCartFromItems()", () => {
  it("builds a cart from a flat array of items", () => {
    const result = buildCartFromItems([
      { name: "A", price: 100, quantity: 2 },
      { name: "B", price: 50, quantity: 1 },
    ]);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("cart");
    if (result!.type !== "cart") return;
    expect(result!.cart.items).toHaveLength(2);
    expect(result!.cart.subtotal).toBe(250); // 100*2 + 50*1
    expect(result!.cart.deliveryFee).toBe(0);
    expect(result!.cart.total).toBe(250);
  });

  it("returns null for empty array", () => {
    expect(buildCartFromItems([])).toBeNull();
  });

  it("returns null when all items lack names", () => {
    expect(buildCartFromItems([{ price: 100 }])).toBeNull();
  });
});

describe("tryParseCart()", () => {
  it("parses a flat array of cart items", () => {
    const result = tryParseCart([
      { name: "Milk", price: 55, quantity: 1 },
      { name: "Bread", price: 30, quantity: 2 },
    ]);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("cart");
    if (result!.type !== "cart") return;
    expect(result!.cart.items).toHaveLength(2);
    expect(result!.cart.subtotal).toBe(115); // 55 + 30*2
    expect(result!.cart.deliveryFee).toBe(0);
    expect(result!.cart.total).toBe(115);
  });

  it("parses nested obj.items", () => {
    const result = tryParseCart({
      items: [{ name: "A", price: 100, quantity: 1 }],
      delivery_fee: 30,
      total: 130,
    });
    expect(result).not.toBeNull();
    if (result!.type !== "cart") return;
    expect(result!.cart.items).toHaveLength(1);
    expect(result!.cart.deliveryFee).toBe(30);
    expect(result!.cart.total).toBe(130);
  });

  it("parses nested obj.cart.items", () => {
    const result = tryParseCart({
      cart: {
        items: [{ name: "B", price: 200, quantity: 1 }],
        subtotal: 200,
        delivery_fee: 25,
        total: 225,
      },
    });
    expect(result).not.toBeNull();
    if (result!.type !== "cart") return;
    expect(result!.cart.items).toHaveLength(1);
    expect(result!.cart.subtotal).toBe(200);
    expect(result!.cart.deliveryFee).toBe(25);
    expect(result!.cart.total).toBe(225);
  });

  it("parses nested obj.data.items", () => {
    const result = tryParseCart({
      data: {
        items: [{ name: "C", price: 80, quantity: 3 }],
        subtotal: 240,
      },
    });
    expect(result).not.toBeNull();
    if (result!.type !== "cart") return;
    expect(result!.cart.items).toHaveLength(1);
    expect(result!.cart.subtotal).toBe(240);
  });

  it("parses 3-level nesting obj.data.cart.items", () => {
    const result = tryParseCart({
      data: {
        cart: {
          items: [{ name: "D", price: 50, quantity: 2 }],
          total: 120,
          delivery_fee: 20,
        },
      },
    });
    expect(result).not.toBeNull();
    if (result!.type !== "cart") return;
    expect(result!.cart.items).toHaveLength(1);
    expect(result!.cart.total).toBe(120);
    expect(result!.cart.deliveryFee).toBe(20);
  });

  it("handles Swiggy lineItems bill breakdown", () => {
    const result = tryParseCart({
      items: [{ name: "Biryani", price: 300, quantity: 1 }],
      lineItems: [
        { label: "Item Total", value: "₹300" },
        { label: "Delivery Fee", value: "₹40" },
        { label: "To Pay", value: "₹340" },
      ],
    });
    expect(result).not.toBeNull();
    if (result!.type !== "cart") return;
    expect(result!.cart.subtotal).toBe(300);
    expect(result!.cart.deliveryFee).toBe(40);
    expect(result!.cart.total).toBe(340);
  });

  it("handles bill_breakdown key", () => {
    const result = tryParseCart({
      items: [{ name: "Naan", price: 60, quantity: 2 }],
      bill_breakdown: [
        { label: "Sub Total", value: "₹120" },
        { label: "Delivery Charge", value: "₹30" },
        { label: "Grand Total", value: "₹150" },
      ],
    });
    if (result!.type !== "cart") return;
    expect(result!.cart.subtotal).toBe(120);
    expect(result!.cart.deliveryFee).toBe(30);
    expect(result!.cart.total).toBe(150);
  });

  it("handles cart_items key", () => {
    const result = tryParseCart({
      cart_items: [{ name: "X", price: 10, quantity: 1 }],
    });
    expect(result).not.toBeNull();
    if (result!.type !== "cart") return;
    expect(result!.cart.items).toHaveLength(1);
  });

  it("handles cartItems key", () => {
    const result = tryParseCart({
      cartItems: [{ name: "Y", price: 20, quantity: 1 }],
    });
    expect(result).not.toBeNull();
    if (result!.type !== "cart") return;
    expect(result!.cart.items).toHaveLength(1);
  });

  it("handles products key for items", () => {
    const result = tryParseCart({
      products: [{ name: "Z", price: 30, quantity: 1 }],
    });
    expect(result).not.toBeNull();
    if (result!.type !== "cart") return;
    expect(result!.cart.items).toHaveLength(1);
  });

  it("handles orderItems and order_items keys", () => {
    const r1 = tryParseCart({
      orderItems: [{ name: "O1", price: 10, quantity: 1 }],
    });
    expect(r1).not.toBeNull();

    const r2 = tryParseCart({
      order_items: [{ name: "O2", price: 20, quantity: 1 }],
    });
    expect(r2).not.toBeNull();
  });

  it("returns null for null input", () => {
    expect(tryParseCart(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(tryParseCart(undefined)).toBeNull();
  });

  it("returns null for a string input", () => {
    expect(tryParseCart("hello")).toBeNull();
  });

  it("returns null for a number input", () => {
    expect(tryParseCart(42)).toBeNull();
  });

  it("returns null for an empty object with no items", () => {
    expect(tryParseCart({})).toBeNull();
  });

  it("returns null for empty items array", () => {
    expect(tryParseCart({ items: [] })).toBeNull();
  });

  it("computes subtotal from items when not provided", () => {
    const result = tryParseCart({
      items: [
        { name: "A", price: 100, quantity: 2 },
        { name: "B", price: 50, quantity: 3 },
      ],
    });
    if (result!.type !== "cart") return;
    // 100*2 + 50*3 = 350
    expect(result!.cart.subtotal).toBe(350);
    expect(result!.cart.total).toBe(350);
  });

  it("falls back to top-level totals when nested level has none", () => {
    const result = tryParseCart({
      cart: {
        items: [{ name: "A", price: 100, quantity: 1 }],
      },
      delivery_fee: 15,
      total: 115,
    });
    if (result!.type !== "cart") return;
    expect(result!.cart.deliveryFee).toBe(15);
    expect(result!.cart.total).toBe(115);
  });

  it("uses deliveryFee (camelCase) key", () => {
    const result = tryParseCart({
      items: [{ name: "A", price: 100, quantity: 1 }],
      deliveryFee: 20,
    });
    if (result!.type !== "cart") return;
    expect(result!.cart.deliveryFee).toBe(20);
  });

  it("uses delivery_charge key", () => {
    const result = tryParseCart({
      items: [{ name: "A", price: 100, quantity: 1 }],
      delivery_charge: 35,
    });
    if (result!.type !== "cart") return;
    expect(result!.cart.deliveryFee).toBe(35);
  });

  it("uses grand_total key", () => {
    const result = tryParseCart({
      items: [{ name: "A", price: 100, quantity: 1 }],
      grand_total: 130,
    });
    if (result!.type !== "cart") return;
    expect(result!.cart.total).toBe(130);
  });

  it("uses bill_total key", () => {
    const result = tryParseCart({
      items: [{ name: "A", price: 100, quantity: 1 }],
      bill_total: 145,
    });
    if (result!.type !== "cart") return;
    expect(result!.cart.total).toBe(145);
  });
});
