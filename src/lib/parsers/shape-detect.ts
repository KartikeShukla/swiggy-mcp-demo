/**
 * Shape-based heuristic detection for payloads that did not match any
 * tool-name-based parser route.
 *
 * @module shape-detect
 */
import type { ParsedToolResult } from "@/lib/types";
import { asArrayOrWrap } from "./primitives";
import { tryParseRestaurants } from "./restaurants";
import { tryParseProducts } from "./products";
import { tryParseTimeSlots } from "./time-slots";
import { tryParseAddresses } from "./addresses";

/** Pattern matching common dish/food names to detect menu-item payloads by item name. */
const DISH_NAME_HINT_PATTERN =
  /\b(paneer|chicken|mutton|fish|prawn|biryani|pizza|burger|sandwich|roll|wrap|tikka|masala|curry|thali|noodles|fries|rice|soup|salad|kebab|falafel|shawarma)\b/i;

/**
 * Classifies an unrecognized payload by inspecting the keys and values of
 * its first item. This is the orchestrator's fallback when no tool-name
 * regex matched a dedicated parser.
 *
 * Detection strategy (first match wins):
 * 1. **No name field** -- checks for time-slot or address shapes by key presence.
 * 2. **Foodorder mixed shapes** -- when both product and restaurant keys exist,
 *    prefers products (menu items commonly carry rating fields).
 * 3. **Foodorder weak-restaurant-only** -- rating-only rows are routed based on
 *    tool name and dish-name hints (menu items vs. restaurant discovery).
 * 4. **Strong/weak restaurant shape** -- routes to restaurant parser.
 * 5. **Product shape** -- routes to product parser.
 * 6. **Time-slot / address** -- secondary check for items with a name field.
 * 7. **Vertical fallback** -- dining/foodorder tries restaurants first, then
 *    products; all others try products.
 *
 * @param payload - The extracted payload array (or single item to be wrapped).
 * @param verticalId - Active vertical for disambiguation.
 * @param toolName - Tool name for restaurant-discovery heuristic.
 * @returns A parsed result or `null` if no shape matches.
 */
export function detectByShape(
  payload: unknown,
  verticalId: string,
  toolName = "",
): ParsedToolResult | null {
  const arr = asArrayOrWrap(payload);
  if (!arr || arr.length === 0) return null;

  const sample = arr[0];
  if (typeof sample !== "object" || sample === null) return null;
  const keys = Object.keys(sample);
  const nameValues = arr
    .slice(0, 5)
    .map((item) =>
      typeof item === "object" && item !== null
        ? String((item as Record<string, unknown>).name ?? "")
        : "",
    );
  const hasDishNameSignals = nameValues.some(
    (name) => name && DISH_NAME_HINT_PATTERN.test(name),
  );
  const hasName = keys.includes("name") || keys.includes("displayName") || keys.includes("title");
  const hasStrongRestaurantShape = keys.includes("cuisine") || keys.includes("cuisines") ||
    keys.includes("deliveryTime") || keys.includes("delivery_time") ||
    keys.includes("costForTwo") || keys.includes("cost_for_two") ||
    keys.includes("areaName") || keys.includes("area_name") ||
    keys.includes("priceForTwo") || keys.includes("price_for_two") ||
    keys.includes("locality") || keys.includes("area") ||
    keys.includes("address") || keys.includes("sla");
  const hasWeakRestaurantShape = keys.includes("rating") ||
    keys.includes("avgRating") || keys.includes("avg_rating");
  const hasProductShape = keys.includes("price") || keys.includes("selling_price") || keys.includes("mrp") ||
    keys.includes("variations") || keys.includes("defaultPrice") || keys.includes("default_price") ||
    keys.includes("basePrice") || keys.includes("isVeg");
  const isRestaurantDiscoveryTool =
    /restaurant/i.test(toolName) && !/menu|dish|item/i.test(toolName);

  if (!hasName) {
    // Time slot shape
    if (keys.includes("time") || keys.includes("slot")) {
      return tryParseTimeSlots(arr);
    }

    // Address shape
    if ((keys.includes("address") || keys.includes("addressLine")) && (keys.includes("label") || keys.includes("tag") || keys.includes("id"))) {
      return tryParseAddresses(arr);
    }

    return null;
  }

  // Foodorder menu payloads can carry rating keys; in mixed cases prefer products.
  if (verticalId === "foodorder" && hasProductShape && (hasStrongRestaurantShape || hasWeakRestaurantShape)) {
    return tryParseProducts(arr) || tryParseRestaurants(arr);
  }

  // In foodorder, rating-only rows are often menu-ish. Treat weak-only shapes as
  // products unless the tool clearly represents restaurant discovery.
  if (
    verticalId === "foodorder" &&
    hasWeakRestaurantShape &&
    !hasStrongRestaurantShape &&
    !hasProductShape
  ) {
    if (!isRestaurantDiscoveryTool || hasDishNameSignals) {
      return tryParseProducts(arr) || tryParseRestaurants(arr);
    }
    return tryParseRestaurants(arr) || tryParseProducts(arr);
  }

  // Restaurant-like shape — expanded key set
  if ((hasStrongRestaurantShape || hasWeakRestaurantShape) && hasName) {
    return tryParseRestaurants(arr);
  }

  // Product-like shape — expanded key set
  if (hasProductShape && hasName) {
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

  // For dining/foodorder verticals, try restaurants first then products
  if (verticalId === "dining" || verticalId === "foodorder") {
    return tryParseRestaurants(arr) || tryParseProducts(arr);
  }

  return tryParseProducts(arr);
}
