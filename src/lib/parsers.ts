import type {
  ParsedToolResult,
  ParsedProduct,
  ParsedRestaurant,
  ParsedTimeSlot,
  ParsedAddress,
  ParsedInfoEntry,
  CartItem,
  TextParseResult,
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
      // Try original data first (before extractPayload strips the structure)
      // so we preserve lineItems / bill breakdown alongside cart items
      const cart = tryParseCart(data) || tryParseCart(payload);
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
    const shaped = detectByShape(payload, verticalId);
    if (shaped) return shaped;

    // Try status on pre-extracted data (has success/message at top level)
    const statusFromData = tryParseStatus(data);
    if (statusFromData) return statusFromData;

    // Try status on extracted payload
    const statusFromPayload = tryParseStatus(payload);
    if (statusFromPayload) return statusFromPayload;

    // Catch-all: any non-empty object becomes an info card
    const info = tryParseInfo(data);
    if (info) return info;

    return { type: "raw", content };
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

    const variations = allVariations(obj.variations);

    if (variations.length <= 1) {
      // Single or no variation: existing behavior
      const variation = variations[0];
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
    } else {
      // Multiple variations: one card per variation
      for (let vi = 0; vi < variations.length; vi++) {
        const variation = variations[vi];
        const priceObj = variation.price as Record<string, unknown> | undefined;
        const variantId = str(obj.id) || str(obj.productId) || str(obj.product_id) || str(obj.item_id) || str(variation.spinId) || String(items.length);

        items.push({
          id: `${variantId}-var-${vi}`,
          name,
          price: num(priceObj?.offerPrice) ?? num(priceObj?.offer_price) ?? num(obj.selling_price) ?? num(obj.price) ?? num(obj.cost) ?? num(obj.offer_price),
          mrp: num(priceObj?.mrp) ?? num(obj.mrp) ?? num(obj.marked_price) ?? num(obj.original_price),
          image: str(obj.image) || str(obj.imageUrl) || str(obj.img) || str(obj.thumbnail) || str(obj.image_url),
          brand: str(obj.brand) || str(obj.brand_name) || str(variation.brandName),
          quantity: str(variation.quantityDescription) || str(obj.quantity) || str(obj.weight) || str(obj.size) || str(obj.pack_size),
          available: obj.isAvail != null ? Boolean(obj.isAvail) : obj.inStock != null ? Boolean(obj.inStock) : obj.available != null ? Boolean(obj.available) : obj.in_stock != null ? Boolean(obj.in_stock) : variation.isInStockAndAvailable != null ? Boolean(variation.isInStockAndAvailable) : true,
          description: str(obj.description) || str(obj.desc),
        });
      }
    }
  }

  return items.length > 0 ? { type: "products", items } : null;
}

function allVariations(variations: unknown): Record<string, unknown>[] {
  if (!Array.isArray(variations) || variations.length === 0) return [];
  return variations.filter(
    (v): v is Record<string, unknown> => typeof v === "object" && v !== null,
  );
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

    // Debug: log raw cart item so we can see exact MCP field names (remove after confirming fix)
    console.log("[parseCartItems] raw item:", JSON.stringify(obj));

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

// --- Status parsing ---

function tryParseStatus(payload: unknown): ParsedToolResult | null {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return null;
  const obj = payload as Record<string, unknown>;

  // Must have a success/status boolean or a message string
  const hasSuccess = typeof obj.success === "boolean";
  const hasStatus = typeof obj.status === "string" || typeof obj.status === "boolean";
  const hasMessage = typeof obj.message === "string" && obj.message.length > 0;

  if (!hasMessage && !hasSuccess && !hasStatus) return null;
  // Need at least a message or a success indicator
  if (!hasMessage && !hasSuccess) return null;

  const success = hasSuccess
    ? Boolean(obj.success)
    : hasStatus
      ? obj.status === true || obj.status === "success" || obj.status === "ok"
      : true;

  const message = (typeof obj.message === "string" && obj.message) ||
    (typeof obj.status === "string" && obj.status) ||
    (success ? "Operation completed successfully" : "Operation failed");

  // Collect remaining fields as details (up to 6)
  const details: Record<string, unknown> = {};
  let count = 0;
  for (const [k, v] of Object.entries(obj)) {
    if (k === "success" || k === "message" || k === "status") continue;
    if (v == null) continue;
    if (count >= 6) break;
    details[k] = v;
    count++;
  }

  return {
    type: "status",
    status: {
      success,
      message,
      details: count > 0 ? details : undefined,
    },
  };
}

// --- Info parsing (catch-all) ---

function humanizeKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function stringifyValue(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) return val.map(stringifyValue).join(", ");
  return JSON.stringify(val);
}

function tryParseInfo(payload: unknown): ParsedToolResult | null {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return null;
  const obj = payload as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length === 0) return null;

  const title = (typeof obj.name === "string" && obj.name) ||
    (typeof obj.title === "string" && obj.title) ||
    (typeof obj.label === "string" && obj.label) ||
    "Details";

  const entries: ParsedInfoEntry[] = [];
  for (const key of keys) {
    const val = obj[key];
    if (val == null) continue;
    const valueStr = stringifyValue(val);
    if (!valueStr) continue;
    entries.push({ key: humanizeKey(key), value: valueStr });
  }

  return entries.length > 0 ? { type: "info", title, entries } : null;
}

// --- Variant text parsing ---

export function parseVariantsFromText(text: string): TextParseResult {
  const segments: TextParseResult["segments"] = [];
  const blockPattern = /\*\*(.+?)(?::?\s*)\*\*\s*\n((?:\s*[-*•]\s+.+\n?)+)/g;
  const variantLinePattern = /[-*•]\s+(.+?)\s*@\s*(?:₹|Rs\.?\s*)([\d,]+(?:\.\d+)?)/;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(text)) !== null) {
    const productName = match[1].trim();
    const variantBlock = match[2];
    const variantLines = variantBlock.split("\n").filter((l) => l.trim());

    const parsedProducts: ParsedProduct[] = [];
    for (let vi = 0; vi < variantLines.length; vi++) {
      const lineMatch = variantLines[vi].match(variantLinePattern);
      if (lineMatch) {
        const quantity = lineMatch[1].trim();
        const price = parseFloat(lineMatch[2].replace(/,/g, ""));
        parsedProducts.push({
          id: `text-variant-${segments.length}-${vi}`,
          name: productName,
          price,
          quantity,
          available: true,
        });
      }
    }

    // Only treat as product block if at least one line has a price match
    if (parsedProducts.length > 0) {
      const before = text.slice(lastIndex, match.index);
      if (before.trim()) {
        segments.push({ type: "text", content: before });
      }
      segments.push({ type: "products", items: parsedProducts });
      lastIndex = match.index + match[0].length;
    }
  }

  // If no products found, return single text segment
  if (segments.length === 0) {
    return { segments: [{ type: "text", content: text }] };
  }

  // Remaining text after last match
  const remaining = text.slice(lastIndex);
  if (remaining.trim()) {
    segments.push({ type: "text", content: remaining });
  }

  return { segments };
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

/** Generic fallback: scan own properties for keys containing price/cost/amount/mrp */
function scanForPrice(obj: Record<string, unknown>): number | undefined {
  for (const [key, val] of Object.entries(obj)) {
    if (/price|cost|amount|mrp/i.test(key) && key !== "priceForTwo" && key !== "price_for_two") {
      const n = num(val) ?? numFromCurrency(val);
      if (n != null && n > 0) return n;
    }
  }
  return undefined;
}

function numFromCurrency(val: unknown): number | undefined {
  if (typeof val !== "string") return undefined;
  const cleaned = val.replace(/[₹,\s]/g, "");
  const n = parseFloat(cleaned);
  return !isNaN(n) ? n : undefined;
}
