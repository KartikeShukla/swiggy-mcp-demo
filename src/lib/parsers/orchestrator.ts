import type { ParsedToolResult } from "@/lib/types";
import { logger } from "@/lib/logger";
import { unwrapContent, extractPayload } from "./unwrap";
import { tryParseProducts } from "./products";
import { tryParseRestaurants } from "./restaurants";
import { tryParseTimeSlots } from "./time-slots";
import { tryParseAddresses } from "./addresses";
import { tryParseCart } from "./cart";
import { tryParseConfirmation } from "./confirmation";
import { tryParseStatus } from "./status";
import { tryParseInfo } from "./info";
import { detectByShape } from "./shape-detect";
import { asArrayOrWrap } from "./primitives";

const PRODUCT_SIGNAL_KEYS = new Set([
  "price",
  "selling_price",
  "mrp",
  "variations",
  "defaultPrice",
  "default_price",
  "basePrice",
  "base_price",
  "offerPrice",
  "offer_price",
  "finalPrice",
  "final_price",
  "productId",
  "product_id",
  "item_id",
  "quantity",
  "weight",
  "size",
  "pack_size",
  "isVeg",
  "vegClassifier",
  "itemAttribute",
  "itemAttributes",
  "category",
  "dishType",
  "menu_item_id",
]);

const STRONG_RESTAURANT_SIGNAL_KEYS = new Set([
  "cuisine",
  "cuisines",
  "priceForTwo",
  "price_for_two",
  "locality",
  "area",
  "address",
  "costForTwo",
  "cost_for_two",
  "deliveryTime",
  "delivery_time",
  "areaName",
  "area_name",
  "sla",
  "feeDetails",
]);

const WEAK_RESTAURANT_SIGNAL_KEYS = new Set([
  "rating",
  "avgRating",
  "avg_rating",
]);

const DISH_NAME_HINT_PATTERN =
  /\b(paneer|chicken|mutton|fish|prawn|biryani|pizza|burger|sandwich|roll|wrap|tikka|masala|curry|thali|noodles|fries|rice|soup|salad|kebab|falafel|shawarma)\b/i;

const MENU_SIGNAL_KEY_RE = /menu|dish|itemattribute|veg|addon|variant|option/i;
const SEARCH_TOOL_RE = /search|find|discover|browse|menu|list|recommend|suggest|get_.*(?:product|restaurant|item|dish|cuisine)/i;
const RESTAURANT_TOOL_RE = /restaurant/i;
const MENU_INTENT_TOOL_RE = /menu|dish|item/i;
const CART_TOOL_RE = /cart|basket|add_item|remove_item|update_item|modify_item|add_to|remove_from/i;
const SLOT_TOOL_RE = /slot|avail|schedule|timeslot/i;
const ADDRESS_TOOL_RE = /address|location|deliver/i;
const CONFIRM_TOOL_RE = /order|place|book|reserve|confirm|checkout|submit/i;

function inferPayloadSignals(payload: unknown): {
  hasProductSignals: boolean;
  hasMenuSignals: boolean;
  hasStrongRestaurantSignals: boolean;
  hasWeakRestaurantSignals: boolean;
  hasDishNameSignals: boolean;
} {
  const arr = asArrayOrWrap(payload);
  if (!arr || arr.length === 0) {
    return {
      hasProductSignals: false,
      hasMenuSignals: false,
      hasStrongRestaurantSignals: false,
      hasWeakRestaurantSignals: false,
      hasDishNameSignals: false,
    };
  }

  let hasProductSignals = false;
  let hasMenuSignals = false;
  let hasStrongRestaurantSignals = false;
  let hasWeakRestaurantSignals = false;
  let hasDishNameSignals = false;

  for (const item of arr.slice(0, 5)) {
    if (typeof item !== "object" || item === null) continue;
    const keys = Object.keys(item as Record<string, unknown>);
    const name = typeof (item as Record<string, unknown>).name === "string"
      ? (item as Record<string, unknown>).name as string
      : "";

    if (keys.some((key) => PRODUCT_SIGNAL_KEYS.has(key))) {
      hasProductSignals = true;
    }
    if (
      keys.some((key) =>
        MENU_SIGNAL_KEY_RE.test(key),
      )
    ) {
      hasMenuSignals = true;
    }
    if (keys.some((key) => STRONG_RESTAURANT_SIGNAL_KEYS.has(key))) {
      hasStrongRestaurantSignals = true;
    }
    if (keys.some((key) => WEAK_RESTAURANT_SIGNAL_KEYS.has(key))) {
      hasWeakRestaurantSignals = true;
    }
    if (name && DISH_NAME_HINT_PATTERN.test(name)) {
      hasDishNameSignals = true;
    }

    if (hasProductSignals && hasMenuSignals && hasStrongRestaurantSignals && hasWeakRestaurantSignals && hasDishNameSignals) {
      break;
    }
  }

  return {
    hasProductSignals,
    hasMenuSignals,
    hasStrongRestaurantSignals,
    hasWeakRestaurantSignals,
    hasDishNameSignals,
  };
}

/**
 * Heuristic parser: examines mcp_tool_result content and tool name
 * to extract structured data for rich card rendering.
 * Returns { type: "raw" } as fallback when nothing matches.
 */
export function parseToolResult(
  toolName: string,
  content: unknown,
  verticalId: string,
  toolInput?: Record<string, unknown>,
): ParsedToolResult {
  try {
    const data = unwrapContent(content);
    const payload = extractPayload(data);

    // Match by tool name patterns
    if (SEARCH_TOOL_RE.test(toolName)) {
      if (verticalId === "foodorder") {
        const isRestaurantDiscoveryTool =
          RESTAURANT_TOOL_RE.test(toolName) && !MENU_INTENT_TOOL_RE.test(toolName);
        const isMenuIntentTool = MENU_INTENT_TOOL_RE.test(toolName);
        const signals = inferPayloadSignals(payload);
        const weakRestaurantOnly =
          signals.hasWeakRestaurantSignals && !signals.hasStrongRestaurantSignals;
        const shouldPreferProducts =
          isMenuIntentTool ||
          signals.hasMenuSignals ||
          (signals.hasProductSignals && !signals.hasStrongRestaurantSignals) ||
          (weakRestaurantOnly && (!isRestaurantDiscoveryTool || signals.hasDishNameSignals));

        if (shouldPreferProducts) {
          const products = tryParseProducts(payload, { toolInput });
          if (products) return products;
        }

        if (signals.hasStrongRestaurantSignals || (signals.hasWeakRestaurantSignals && isRestaurantDiscoveryTool)) {
          const restaurants = tryParseRestaurants(payload);
          if (restaurants) return restaurants;
        }

        const products = tryParseProducts(payload, { toolInput });
        if (products) return products;
        const restaurants = tryParseRestaurants(payload);
        if (restaurants) return restaurants;
      }

      if (verticalId === "dining") {
        const restaurants = tryParseRestaurants(payload);
        if (restaurants) return restaurants;
      }

      // Always try products (including dining — dining can have menu/dish searches)
      const products = tryParseProducts(payload, { toolInput });
      if (products) return products;
    }
    if (CART_TOOL_RE.test(toolName)) {
      // Try original data first (before extractPayload strips the structure)
      // so we preserve lineItems / bill breakdown alongside cart items
      const cart = tryParseCart(data) || tryParseCart(payload);
      if (cart) return cart;
    }
    if (SLOT_TOOL_RE.test(toolName)) {
      const slots = tryParseTimeSlots(payload);
      if (slots) return slots;
    }
    if (ADDRESS_TOOL_RE.test(toolName)) {
      const addresses = tryParseAddresses(payload);
      if (addresses) return addresses;
    }
    if (CONFIRM_TOOL_RE.test(toolName)) {
      const confirmation = tryParseConfirmation(payload, toolName);
      if (confirmation) return confirmation;
    }

    // Before shape detection, check if data is a status-like response with embedded cart
    // (e.g. { success: true, message: "Added", cart: { items: [...] } })
    // Without this check, extractPayload would pull out the cart items and shape detection
    // would render them as products instead of a cart card.
    if (typeof data === "object" && data !== null && !Array.isArray(data)) {
      const dataObj = data as Record<string, unknown>;
      if (dataObj.success != null || dataObj.message != null) {
        const embeddedCart = tryParseCart(data);
        if (embeddedCart) return embeddedCart;
      }
    }

    // Fall back to shape detection
    const shaped = detectByShape(payload, verticalId, toolName);
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

    const result: ParsedToolResult = { type: "raw", content };
    logger.debug(`parseToolResult: tool="${toolName}" vertical="${verticalId}" → ${result.type}`);
    return result;
  } catch (err) {
    logger.warn("parseToolResult failed, falling back to raw", { toolName, err });
    return { type: "raw", content };
  }
}
