/**
 * Routing signals for the parser orchestrator.
 *
 * This module provides:
 * - **Tool-name regex patterns** for matching MCP tool names to parser routes.
 * - **Signal key sets** for inspecting payload object keys to classify content
 *   as products, restaurants, or mixed.
 * - **`inferPayloadSignals`** for sampling the first few items to build a
 *   `PayloadSignals` descriptor used by the orchestrator's search routing.
 * - **Decision functions** (`shouldPreferFoodorderProducts`,
 *   `shouldParseFoodorderRestaurants`) that combine tool-name hints and payload
 *   signals to resolve ambiguous foodorder search results.
 *
 * @module routing-signals
 */
import { asArrayOrWrap } from "./primitives";

/**
 * Keys whose presence on a payload item strongly indicate a product/menu-item
 * shape (pricing, quantity, dietary attributes, item identifiers).
 */
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

/**
 * Keys whose presence strongly indicate a restaurant shape (cuisine, location,
 * delivery details, price-for-two). These are sufficient on their own to
 * classify a payload as restaurant data.
 */
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

/**
 * Keys that weakly suggest a restaurant shape (rating fields). These are
 * ambiguous because menu items also carry ratings. Only treated as restaurant
 * signals when combined with a restaurant-discovery tool name or strong keys.
 */
const WEAK_RESTAURANT_SIGNAL_KEYS = new Set([
  "rating",
  "avgRating",
  "avg_rating",
]);

/** Pattern matching common dish/food names to detect menu-item payloads by item name. */
const DISH_NAME_HINT_PATTERN =
  /\b(paneer|chicken|mutton|fish|prawn|biryani|pizza|burger|sandwich|roll|wrap|tikka|masala|curry|thali|noodles|fries|rice|soup|salad|kebab|falafel|shawarma)\b/i;

/** Regex matching key names that indicate menu-specific payload structure. */
const MENU_SIGNAL_KEY_RE = /menu|dish|itemattribute|veg|addon|variant|option/i;

/** Matches tool names that return searchable content (products, restaurants, menu items). */
export const SEARCH_TOOL_RE = /search|find|discover|browse|menu|list|recommend|suggest|get_.*(?:product|restaurant|item|dish|cuisine)/i;
/** Matches tool names that relate to restaurant discovery. */
export const RESTAURANT_TOOL_RE = /restaurant/i;
/** Matches tool names that indicate menu/dish/item intent (not restaurant discovery). */
export const MENU_INTENT_TOOL_RE = /menu|dish|item/i;
/** Matches tool names that operate on the shopping cart. */
export const CART_TOOL_RE = /cart|basket|add_item|remove_item|update_item|modify_item|add_to|remove_from/i;
/** Matches tool names that return time-slot / scheduling data. */
export const SLOT_TOOL_RE = /slot|avail|schedule|timeslot/i;
/** Matches tool names that return address / location data. */
export const ADDRESS_TOOL_RE = /address|location|deliver/i;
/** Matches tool names that perform order/booking confirmation. */
export const CONFIRM_TOOL_RE = /order|place|book|reserve|confirm|checkout|submit/i;

/** Enlarged candidate pool for dining restaurants when reranking is enabled. */
export const DINING_RESTAURANT_CANDIDATES = 15;
/** Enlarged candidate pool for foodorder menu items when reranking is enabled. */
export const FOODORDER_MENU_CANDIDATES = 15;
/** Enlarged candidate pool for foodorder restaurants when reranking is enabled. */
export const FOODORDER_RESTAURANT_CANDIDATES = 15;

export interface PayloadSignals {
  hasProductSignals: boolean;
  hasMenuSignals: boolean;
  hasStrongRestaurantSignals: boolean;
  hasWeakRestaurantSignals: boolean;
  hasDishNameSignals: boolean;
}

const EMPTY_SIGNALS: PayloadSignals = {
  hasProductSignals: false,
  hasMenuSignals: false,
  hasStrongRestaurantSignals: false,
  hasWeakRestaurantSignals: false,
  hasDishNameSignals: false,
};

/**
 * Samples up to the first 5 items in a payload array and checks their keys
 * and name values against known signal sets.
 *
 * Sampling is limited to 5 items for performance -- the first few items are
 * representative of the entire payload shape. The function short-circuits
 * once all signal flags are set.
 *
 * @returns A `PayloadSignals` object describing which data-shape signals were
 *   detected, used by the orchestrator to route foodorder search results
 *   to the correct parser (products vs. restaurants).
 */
export function inferPayloadSignals(payload: unknown): PayloadSignals {
  const arr = asArrayOrWrap(payload);
  if (!arr || arr.length === 0) return EMPTY_SIGNALS;

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
    if (keys.some((key) => MENU_SIGNAL_KEY_RE.test(key))) {
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
 * Decides whether a foodorder search result should be parsed as products
 * (menu items) rather than restaurants.
 *
 * Returns `true` when any of the following hold:
 * - The tool name indicates menu/dish/item intent.
 * - The payload contains menu-specific key signals.
 * - Product signals are present without strong restaurant signals.
 * - Only weak restaurant signals exist (e.g. rating) and the tool is not a
 *   pure restaurant-discovery tool, or the item names match common dish names.
 *
 * This is called before `shouldParseFoodorderRestaurants`; products take
 * priority when signals are ambiguous and menu-oriented.
 */
export function shouldPreferFoodorderProducts(
  toolName: string,
  signals: PayloadSignals,
): boolean {
  const isRestaurantDiscoveryTool =
    RESTAURANT_TOOL_RE.test(toolName) && !MENU_INTENT_TOOL_RE.test(toolName);
  const isMenuIntentTool = MENU_INTENT_TOOL_RE.test(toolName);
  const weakRestaurantOnly =
    signals.hasWeakRestaurantSignals && !signals.hasStrongRestaurantSignals;

  return (
    isMenuIntentTool ||
    signals.hasMenuSignals ||
    (signals.hasProductSignals && !signals.hasStrongRestaurantSignals) ||
    (weakRestaurantOnly && (!isRestaurantDiscoveryTool || signals.hasDishNameSignals))
  );
}

/**
 * Decides whether a foodorder search result should be parsed as restaurants.
 *
 * Returns `true` when:
 * - Strong restaurant signals are present (cuisine, location, price-for-two, etc.), OR
 * - Weak restaurant signals (rating) are present AND the tool name matches
 *   restaurant discovery (without menu/dish/item intent).
 *
 * This is checked after `shouldPreferFoodorderProducts` as a secondary route
 * for payloads that clearly describe restaurants.
 */
export function shouldParseFoodorderRestaurants(
  toolName: string,
  signals: PayloadSignals,
): boolean {
  const isRestaurantDiscoveryTool =
    RESTAURANT_TOOL_RE.test(toolName) && !MENU_INTENT_TOOL_RE.test(toolName);

  return (
    signals.hasStrongRestaurantSignals ||
    (signals.hasWeakRestaurantSignals && isRestaurantDiscoveryTool)
  );
}
