import type { ParsedToolResult } from "@/lib/types";
import { asArray } from "./primitives";
import { tryParseRestaurants } from "./restaurants";
import { tryParseProducts } from "./products";
import { tryParseTimeSlots } from "./time-slots";
import { tryParseAddresses } from "./addresses";

export function detectByShape(payload: unknown, verticalId: string): ParsedToolResult | null {
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
