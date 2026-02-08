import type {
  ParsedToolResult,
  ParsedProduct,
  ParsedRestaurant,
  ParsedTimeSlot,
  ParsedAddress,
  CartItem,
} from "./types";

/**
 * Heuristic parser: examines mcp_tool_result content and tool name
 * to extract structured data for rich card rendering.
 * Returns { type: "raw" } as fallback when nothing matches.
 */
export function parseToolResult(
  toolName: string,
  content: unknown,
  verticalId: string,
): ParsedToolResult {
  try {
    const data = unwrapContent(content);
    const payload = extractPayload(data);

    // Match by tool name patterns
    if (/search|find|discover|browse|menu/i.test(toolName)) {
      if (verticalId === "dining" || verticalId === "foodorder") {
        const restaurants = tryParseRestaurants(payload);
        if (restaurants) return restaurants;
      }
      if (verticalId === "foodorder" && /menu/i.test(toolName)) {
        const products = tryParseProducts(payload);
        if (products) return products;
      }
      if (verticalId !== "dining") {
        const products = tryParseProducts(payload);
        if (products) return products;
      }
    }
    if (/cart|basket/i.test(toolName)) {
      const cart = tryParseCart(payload);
      if (cart) return cart;
    }
    if (/slot|avail/i.test(toolName)) {
      const slots = tryParseTimeSlots(payload);
      if (slots) return slots;
    }
    if (/address|location/i.test(toolName)) {
      const addresses = tryParseAddresses(payload);
      if (addresses) return addresses;
    }
    if (/order|place|book|reserve|confirm/i.test(toolName)) {
      const confirmation = tryParseConfirmation(payload, toolName);
      if (confirmation) return confirmation;
    }

    // Fall back to shape detection
    return detectByShape(payload, verticalId) ?? { type: "raw", content };
  } catch {
    return { type: "raw", content };
  }
}

function tryParseJSON(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

/**
 * Unwrap Anthropic API's BetaMCPToolResultBlock content format.
 * Content can be:
 *  - a plain string (e.g. '{"items": [...]}')
 *  - an Array<BetaTextBlock> (e.g. [{ type: "text", text: '{"items": [...]}', citations: null }])
 * This function normalises both cases into parsed data.
 */
function unwrapContent(content: unknown): unknown {
  if (Array.isArray(content)) {
    const textParts: string[] = [];
    for (const item of content) {
      if (typeof item === "object" && item !== null) {
        const obj = item as Record<string, unknown>;
        if (obj.type === "text" && typeof obj.text === "string") {
          textParts.push(obj.text);
        }
      }
    }
    if (textParts.length > 0) {
      const combined = textParts.join("\n");
      return tryParseJSON(combined);
    }
  }
  if (typeof content === "string") {
    return tryParseJSON(content);
  }
  return content;
}

function extractPayload(content: unknown, depth = 0): unknown {
  if (depth > 2) return content;
  if (Array.isArray(content)) return content;
  if (typeof content === "object" && content !== null) {
    const obj = content as Record<string, unknown>;
    for (const key of [
      "data", "results", "items", "products", "restaurants", "menu",
      "dishes", "addresses", "cart", "cart_items", "slots",
    ]) {
      if (key in obj && obj[key] != null) {
        return extractPayload(obj[key], depth + 1);
      }
    }
  }
  return content;
}

// --- Product parsing ---

function tryParseProducts(payload: unknown): ParsedToolResult | null {
  const arr = asArray(payload);
  if (!arr || arr.length === 0) return null;

  const items: ParsedProduct[] = [];
  for (const item of arr) {
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;
    const name = str(obj.name) || str(obj.displayName) || str(obj.product_name) || str(obj.title);
    if (!name) continue;

    // Extract pricing from Swiggy's nested variations structure
    const variation = firstVariation(obj.variations);
    const priceObj = variation?.price as Record<string, unknown> | undefined;

    items.push({
      id: str(obj.id) || str(obj.productId) || str(obj.product_id) || str(obj.item_id) || str(variation?.spinId) || String(items.length),
      name,
      price: num(priceObj?.offerPrice) ?? num(priceObj?.offer_price) ?? num(obj.selling_price) ?? num(obj.price) ?? num(obj.cost) ?? num(obj.offer_price),
      mrp: num(priceObj?.mrp) ?? num(obj.mrp) ?? num(obj.marked_price) ?? num(obj.original_price),
      image: str(obj.image) || str(obj.imageUrl) || str(obj.img) || str(obj.thumbnail) || str(obj.image_url),
      brand: str(obj.brand) || str(obj.brand_name) || str(variation?.brandName),
      quantity: str(variation?.quantityDescription) || str(obj.quantity) || str(obj.weight) || str(obj.size) || str(obj.pack_size),
      available: obj.isAvail != null ? Boolean(obj.isAvail) : obj.inStock != null ? Boolean(obj.inStock) : obj.available != null ? Boolean(obj.available) : obj.in_stock != null ? Boolean(obj.in_stock) : variation?.isInStockAndAvailable != null ? Boolean(variation.isInStockAndAvailable) : true,
      description: str(obj.description) || str(obj.desc),
    });
  }

  return items.length > 0 ? { type: "products", items } : null;
}

function firstVariation(variations: unknown): Record<string, unknown> | undefined {
  if (!Array.isArray(variations) || variations.length === 0) return undefined;
  const v = variations[0];
  return typeof v === "object" && v !== null ? v as Record<string, unknown> : undefined;
}

// --- Restaurant parsing ---

function tryParseRestaurants(payload: unknown): ParsedToolResult | null {
  const arr = asArray(payload);
  if (!arr || arr.length === 0) return null;

  const items: ParsedRestaurant[] = [];
  for (const item of arr) {
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;
    const name = str(obj.name) || str(obj.displayName) || str(obj.restaurant_name) || str(obj.title);
    if (!name) continue;

    // Must look somewhat like a restaurant
    const hasRestaurantFields = obj.cuisine || obj.cuisines || obj.rating || obj.priceForTwo ||
      obj.price_for_two || obj.locality || obj.area || obj.address;
    if (!hasRestaurantFields) continue;

    const cuisineRaw = obj.cuisine || obj.cuisines;
    const cuisine = Array.isArray(cuisineRaw) ? cuisineRaw.join(", ") : str(cuisineRaw);

    const offersRaw = obj.offers || obj.active_offers;
    const offers = Array.isArray(offersRaw)
      ? offersRaw.map((o: unknown) => (typeof o === "string" ? o : typeof o === "object" && o !== null ? str((o as Record<string, unknown>).title) || str((o as Record<string, unknown>).description) || JSON.stringify(o) : String(o)))
      : undefined;

    items.push({
      id: str(obj.id) || str(obj.restaurant_id) || String(items.length),
      name,
      cuisine: cuisine || undefined,
      rating: num(obj.rating) ?? num(obj.avg_rating),
      priceForTwo: str(obj.priceForTwo) || str(obj.price_for_two) || (num(obj.cost_for_two) ? `₹${num(obj.cost_for_two)}` : undefined),
      image: str(obj.image) || str(obj.imageUrl) || str(obj.img) || str(obj.thumbnail) || str(obj.image_url),
      address: str(obj.address) || str(obj.full_address),
      offers,
      locality: str(obj.locality) || str(obj.area) || str(obj.location),
    });
  }

  return items.length > 0 ? { type: "restaurants", items } : null;
}

// --- Time slot parsing ---

function tryParseTimeSlots(payload: unknown): ParsedToolResult | null {
  const arr = asArray(payload);
  if (!arr || arr.length === 0) return null;

  const slots: ParsedTimeSlot[] = [];
  for (const item of arr) {
    if (typeof item === "string") {
      slots.push({ time: item, available: true });
      continue;
    }
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;
    const time = str(obj.time) || str(obj.slot) || str(obj.label) || str(obj.start_time);
    if (!time) continue;
    slots.push({
      time,
      available: obj.available != null ? Boolean(obj.available) : true,
    });
  }

  return slots.length > 0 ? { type: "time_slots", slots } : null;
}

// --- Address parsing ---

function tryParseAddresses(payload: unknown): ParsedToolResult | null {
  const arr = asArray(payload);
  if (!arr || arr.length === 0) return null;

  const addresses: ParsedAddress[] = [];
  for (const item of arr) {
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;
    const address = str(obj.address) || str(obj.addressLine) || str(obj.full_address) || str(obj.formatted_address);
    if (!address) continue;

    addresses.push({
      id: str(obj.id) || str(obj.address_id) || String(addresses.length),
      label: str(obj.label) || str(obj.type) || str(obj.tag) || str(obj.annotation) || str(obj.category) || "Address",
      address,
      lat: num(obj.lat) ?? num(obj.latitude),
      lng: num(obj.lng) ?? num(obj.longitude),
    });
  }

  return addresses.length > 0 ? { type: "addresses", addresses } : null;
}

// --- Cart parsing ---

function tryParseCart(payload: unknown): ParsedToolResult | null {
  if (typeof payload !== "object" || payload === null) {
    const arr = asArray(payload);
    if (arr) return buildCartFromItems(arr);
    return null;
  }

  const obj = payload as Record<string, unknown>;

  // Look for items array within the cart object (try multiple nesting patterns)
  const itemsRaw = obj.items || obj.cart_items || obj.products || obj.cartItems;
  let arr = asArray(itemsRaw);

  // Swiggy update_cart may nest items under a cart sub-object
  if (!arr && typeof obj.cart === "object" && obj.cart !== null) {
    const cartObj = obj.cart as Record<string, unknown>;
    arr = asArray(cartObj.items || cartObj.cart_items || cartObj.products);
  }

  if (!arr) return null;

  const items = parseCartItems(arr);
  if (items.length === 0) return null;

  const subtotal = num(obj.subtotal) ?? num(obj.sub_total) ?? items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = num(obj.delivery_fee) ?? num(obj.deliveryFee) ?? num(obj.delivery_charge) ?? 0;
  const total = num(obj.total) ?? num(obj.grand_total) ?? num(obj.bill_total) ?? subtotal + deliveryFee;

  return {
    type: "cart",
    cart: { items, subtotal, deliveryFee, total },
  };
}

function buildCartFromItems(arr: unknown[]): ParsedToolResult | null {
  const items = parseCartItems(arr);
  if (items.length === 0) return null;
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  return { type: "cart", cart: { items, subtotal, deliveryFee: 0, total: subtotal } };
}

function parseCartItems(arr: unknown[]): CartItem[] {
  const items: CartItem[] = [];
  for (const item of arr) {
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;
    const name = str(obj.name) || str(obj.displayName) || str(obj.product_name) || str(obj.title);
    if (!name) continue;
    const variation = firstVariation(obj.variations);
    const priceObj = variation?.price as Record<string, unknown> | undefined;
    items.push({
      id: str(obj.id) || str(obj.productId) || str(obj.product_id) || String(items.length),
      name,
      price: num(priceObj?.offerPrice) ?? num(obj.price) ?? num(obj.selling_price) ?? num(obj.cost) ?? 0,
      quantity: num(obj.quantity) ?? num(obj.qty) ?? num(obj.count) ?? 1,
      image: str(obj.image) || str(obj.imageUrl) || str(obj.img),
    });
  }
  return items;
}

// --- Confirmation parsing ---

function tryParseConfirmation(payload: unknown, toolName: string): ParsedToolResult | null {
  if (typeof payload !== "object" || payload === null) return null;
  const obj = payload as Record<string, unknown>;

  // Check for order placement
  if (/order|place/i.test(toolName)) {
    return {
      type: "order_placed",
      orderId: str(obj.order_id) || str(obj.orderId) || str(obj.id),
      status: str(obj.status) || str(obj.message) || "Order placed",
    };
  }

  // Check for booking confirmation
  if (/book|reserve/i.test(toolName)) {
    return {
      type: "booking_confirmed",
      details: obj as Record<string, unknown>,
    };
  }

  return null;
}

// --- Shape detection fallback ---

function detectByShape(payload: unknown, verticalId: string): ParsedToolResult | null {
  const arr = asArray(payload);
  if (!arr || arr.length === 0) return null;

  const sample = arr[0];
  if (typeof sample !== "object" || sample === null) return null;
  const keys = Object.keys(sample);
  const hasName = keys.includes("name") || keys.includes("displayName");

  // Restaurant-like shape
  if ((keys.includes("cuisine") || keys.includes("cuisines") || keys.includes("rating")) && hasName) {
    return tryParseRestaurants(arr);
  }

  // Product-like shape
  if ((keys.includes("price") || keys.includes("selling_price") || keys.includes("mrp") || keys.includes("variations")) && hasName) {
    return tryParseProducts(arr);
  }

  // Time slot shape
  if (keys.includes("time") || keys.includes("slot")) {
    return tryParseTimeSlots(arr);
  }

  // Address shape
  if ((keys.includes("address") || keys.includes("addressLine")) && (keys.includes("label") || keys.includes("tag") || keys.includes("id"))) {
    return tryParseAddresses(arr);
  }

  // For dining vertical, try restaurants first
  if (verticalId === "dining") {
    return tryParseRestaurants(arr) || tryParseProducts(arr);
  }

  return tryParseProducts(arr);
}

// --- Utilities ---

function asArray(val: unknown): unknown[] | null {
  if (Array.isArray(val)) return val;
  return null;
}

function str(val: unknown): string | undefined {
  if (typeof val === "string" && val.length > 0) return val;
  if (typeof val === "number") return String(val);
  return undefined;
}

function num(val: unknown): number | undefined {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const n = parseFloat(val);
    if (!isNaN(n)) return n;
  }
  return undefined;
}
