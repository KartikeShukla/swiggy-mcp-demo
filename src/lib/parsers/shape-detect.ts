import type { ParsedToolResult } from "@/lib/types";
import { asArrayOrWrap } from "./primitives";
import { tryParseRestaurants } from "./restaurants";
import { tryParseProducts } from "./products";
import { tryParseTimeSlots } from "./time-slots";
import { tryParseAddresses } from "./addresses";

export function detectByShape(payload: unknown, verticalId: string): ParsedToolResult | null {
  const arr = asArrayOrWrap(payload);
  if (!arr || arr.length === 0) return null;

  const sample = arr[0];
  if (typeof sample !== "object" || sample === null) return null;
  const keys = Object.keys(sample);
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
