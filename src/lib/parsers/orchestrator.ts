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
    if (/search|find|discover|browse|menu|list|recommend|suggest|get_.*(?:product|restaurant|item|dish|cuisine)/i.test(toolName)) {
      if (verticalId === "dining" || verticalId === "foodorder") {
        const restaurants = tryParseRestaurants(payload);
        if (restaurants) return restaurants;
      }
      if (verticalId === "foodorder" && /menu/i.test(toolName)) {
        const products = tryParseProducts(payload);
        if (products) return products;
      }
      // Always try products (including dining — dining can have menu/dish searches)
      const products = tryParseProducts(payload);
      if (products) return products;
    }
    if (/cart|basket|add_item|remove_item|update_item|modify_item|add_to|remove_from/i.test(toolName)) {
      // Try original data first (before extractPayload strips the structure)
      // so we preserve lineItems / bill breakdown alongside cart items
      const cart = tryParseCart(data) || tryParseCart(payload);
      if (cart) return cart;
    }
    if (/slot|avail|schedule|timeslot/i.test(toolName)) {
      const slots = tryParseTimeSlots(payload);
      if (slots) return slots;
    }
    if (/address|location|deliver/i.test(toolName)) {
      const addresses = tryParseAddresses(payload);
      if (addresses) return addresses;
    }
    if (/order|place|book|reserve|confirm|checkout|submit/i.test(toolName)) {
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

    const result: ParsedToolResult = { type: "raw", content };
    logger.debug(`parseToolResult: tool="${toolName}" vertical="${verticalId}" → ${result.type}`);
    return result;
  } catch (err) {
    logger.warn("parseToolResult failed, falling back to raw", { toolName, err });
    return { type: "raw", content };
  }
}
