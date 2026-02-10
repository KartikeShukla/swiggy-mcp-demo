import type { ParsedToolResult, CartItem } from "@/lib/types";
import { asArray, str, num, numFromCurrency, scanForPrice } from "./primitives";
import { allVariations } from "./products";

export function tryParseCart(payload: unknown): ParsedToolResult | null {
  // Handle array of items directly (e.g. when extractPayload stripped the wrapper)
  if (Array.isArray(payload)) {
    return buildCartFromItems(payload);
  }

  if (typeof payload !== "object" || payload === null) return null;

  const obj = payload as Record<string, unknown>;

  // Look for items array within the cart object (try multiple nesting patterns)
  const itemsRaw = obj.items || obj.cart_items || obj.products || obj.cartItems || obj.orderItems || obj.order_items;
  let arr = asArray(itemsRaw);

  // Swiggy update_cart may nest items under a cart or data sub-object
  // Track the nesting level where we find items so we can also grab bill totals from there
  let nestObj: Record<string, unknown> | undefined;

  if (!arr && typeof obj.cart === "object" && obj.cart !== null) {
    const cartObj = obj.cart as Record<string, unknown>;
    arr = asArray(cartObj.items || cartObj.cart_items || cartObj.products || cartObj.cartItems);
    if (arr) nestObj = cartObj;
  }
  if (!arr && typeof obj.data === "object" && obj.data !== null) {
    const dataObj = obj.data as Record<string, unknown>;
    arr = asArray(dataObj.items || dataObj.cart_items || dataObj.products || dataObj.cartItems);
    if (arr) nestObj = dataObj;

    // 3-level nesting: obj.data.cart.items
    if (!arr && typeof dataObj.cart === "object" && dataObj.cart !== null) {
      const dataCartObj = dataObj.cart as Record<string, unknown>;
      arr = asArray(dataCartObj.items || dataCartObj.cart_items || dataCartObj.products || dataCartObj.cartItems);
      if (arr) nestObj = dataCartObj;
    }
  }

  if (!arr) return null;

  const items = parseCartItems(arr);
  if (items.length === 0) return null;

  // Collect totals from the level where items were found, then fall back to top level
  const src = nestObj || obj;
  let subtotal = num(src.subtotal) ?? num(src.sub_total) ?? num(obj.subtotal) ?? num(obj.sub_total) ?? items.reduce((s, i) => s + i.price * i.quantity, 0);
  let deliveryFee = num(src.delivery_fee) ?? num(src.deliveryFee) ?? num(src.delivery_charge) ?? num(obj.delivery_fee) ?? num(obj.deliveryFee) ?? num(obj.delivery_charge) ?? 0;
  let total = num(src.total) ?? num(src.grand_total) ?? num(src.bill_total) ?? num(obj.total) ?? num(obj.grand_total) ?? num(obj.bill_total);

  // Extract totals from Swiggy's lineItems bill breakdown (check nested level first, then top level)
  const lineItemsRaw = asArray(src.lineItems) || asArray(src.line_items) || asArray(src.billBreakdown) || asArray(src.bill_breakdown) || asArray(obj.lineItems) || asArray(obj.line_items) || asArray(obj.billBreakdown) || asArray(obj.bill_breakdown);
  if (lineItemsRaw) {
    for (const li of lineItemsRaw) {
      if (typeof li !== "object" || li === null) continue;
      const liObj = li as Record<string, unknown>;
      const label = (str(liObj.label) || "").toLowerCase();
      const rawValue = str(liObj.value) || str(liObj.amount) || "";
      const parsed = parseFloat(rawValue.replace(/[₹,\s]/g, ""));
      if (isNaN(parsed)) continue;

      if (label.includes("item total") || label.includes("subtotal") || label.includes("sub total")) {
        subtotal = parsed;
      } else if (label.includes("delivery")) {
        deliveryFee = parsed;
      }
      if (label.includes("to pay") || label.includes("grand total") || label.includes("final total")) {
        total = parsed;
      }
    }
  }

  total = total ?? subtotal + deliveryFee;

  return {
    type: "cart",
    cart: { items, subtotal, deliveryFee, total },
  };
}

export function buildCartFromItems(arr: unknown[]): ParsedToolResult | null {
  const items = parseCartItems(arr);
  if (items.length === 0) return null;
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  return { type: "cart", cart: { items, subtotal, deliveryFee: 0, total: subtotal } };
}

export function parseCartItems(arr: unknown[]): CartItem[] {
  const items: CartItem[] = [];
  for (const item of arr) {
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;

    const name = str(obj.name) || str(obj.displayName) || str(obj.product_name) || str(obj.title) || str(obj.itemName) || str(obj.item_name);
    if (!name) continue;
    const variation = allVariations(obj.variations)[0];
    const priceObj = variation?.price as Record<string, unknown> | undefined;

    // Price may be: a number, a nested object { offerPrice, mrp }, or at item level
    const itemPriceObj = typeof obj.price === "object" && obj.price !== null
      ? obj.price as Record<string, unknown>
      : undefined;

    const price =
      num(priceObj?.offerPrice) ?? num(priceObj?.offer_price) ??
      num(itemPriceObj?.offerPrice) ?? num(itemPriceObj?.offer_price) ?? num(itemPriceObj?.mrp) ??
      num(itemPriceObj?.value) ?? num(itemPriceObj?.amount) ?? num(itemPriceObj?.finalPrice) ?? num(itemPriceObj?.displayPrice) ??
      num(obj.offerPrice) ?? num(obj.offer_price) ??
      num(obj.effectiveItemPrice) ?? num(obj.totalPrice) ?? num(obj.itemPrice) ?? num(obj.basePrice) ??
      num(obj.mrp) ??
      num(obj.displayPrice) ?? num(obj.display_price) ??
      num(obj.finalPrice) ?? num(obj.final_price) ??
      num(obj.unitPrice) ?? num(obj.unit_price) ??
      num(obj.amount) ??
      num(obj.discountedPrice) ?? num(obj.discounted_price) ??
      numFromCurrency(obj.price) ?? numFromCurrency(obj.offerPrice) ??
      num(obj.price) ?? num(obj.selling_price) ?? num(obj.cost) ??
      scanForPrice(obj) ?? 0;

    items.push({
      id: str(obj.id) || str(obj.productId) || str(obj.product_id) || str(obj.spinId) || str(obj.spin_id) || String(items.length),
      name,
      price,
      quantity: num(obj.quantity) ?? num(obj.qty) ?? num(obj.count) ?? 1,
      image: str(obj.image) || str(obj.imageUrl) || str(obj.img),
    });
  }
  return items;
}
