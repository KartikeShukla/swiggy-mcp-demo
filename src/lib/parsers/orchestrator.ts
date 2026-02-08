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
  } catch (err) {
    logger.warn("parseToolResult failed, falling back to raw", { toolName, err });
    return { type: "raw", content };
  }
}
