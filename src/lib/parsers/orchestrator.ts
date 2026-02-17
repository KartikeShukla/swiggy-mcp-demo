/**
 * Parser orchestrator — converts raw MCP tool-result content into typed
 * `ParsedToolResult` models for rich card rendering.
 *
 * **Routing priority** (first match wins):
 * 1. Search tools  — vertical-specific product/restaurant parsing
 * 2. Cart tools    — cart payload extraction
 * 3. Slot tools    — time-slot parsing
 * 4. Address tools — address list parsing
 * 5. Confirm tools — order/booking confirmation parsing
 * 6. Embedded cart  — status-like wrappers that contain cart data
 * 7. Shape detect  — heuristic fallback based on payload key shapes
 * 8. Status        — success/error status messages
 * 9. Info          — key-value informational cards
 * 10. Raw          — unstructured fallback (always returned, never throws)
 *
 * **Contract**: This module never throws. Every code path returns a valid
 * `ParsedToolResult`. Exceptions are caught and produce `{ type: "raw" }`.
 *
 * When relevance reranking is enabled (dining/foodorder with render context),
 * the orchestrator uses enlarged candidate pools and applies strict-first
 * reranking via `postProcessParsedResult` after parsing.
 *
 * @module orchestrator
 */
import type { ParsedToolResult, ToolRenderContext } from "@/lib/types";
import { MAX_MENU_PRODUCTS_SHOWN } from "@/lib/constants";
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
import {
  SEARCH_TOOL_RE,
  CART_TOOL_RE,
  SLOT_TOOL_RE,
  ADDRESS_TOOL_RE,
  CONFIRM_TOOL_RE,
  DINING_RESTAURANT_CANDIDATES,
  FOODORDER_MENU_CANDIDATES,
  FOODORDER_RESTAURANT_CANDIDATES,
  inferPayloadSignals,
  shouldPreferFoodorderProducts,
  shouldParseFoodorderRestaurants,
} from "./routing-signals";
import { postProcessParsedResult } from "./relevance-postprocess";

/**
 * Determines whether relevance reranking should apply to parser output.
 * Requires a render context (which carries the latest query and constraints).
 * When enabled, the orchestrator uses enlarged candidate pools for dining/foodorder
 * and applies strict-first reranking after parsing.
 */
function shouldEnableRelevanceReranking(
  verticalId: string,
  renderContext?: ToolRenderContext,
): boolean {
  if (!renderContext) return false;
  return (
    verticalId === "dining" ||
    verticalId === "foodorder" ||
    verticalId === "food" ||
    verticalId === "style"
  );
}

/** Convenience wrapper that forwards a parsed result through post-processing. */
function withPostProcess(
  parsed: ParsedToolResult,
  toolName: string,
  verticalId: string,
  renderContext: ToolRenderContext | undefined,
  enableRelevanceReranking: boolean,
): ParsedToolResult {
  return postProcessParsedResult(
    parsed,
    toolName,
    verticalId,
    renderContext,
    enableRelevanceReranking,
  );
}

/**
 * Routes search-like tool results to the correct parser based on vertical.
 *
 * - **foodorder**: Inspects payload signals to decide between products (menu items)
 *   and restaurants. Tries the preferred type first, falls back to the other.
 *   Signal-based routing uses `inferPayloadSignals` + `shouldPreferFoodorderProducts`
 *   / `shouldParseFoodorderRestaurants` to disambiguate mixed payloads.
 * - **dining**: Always attempts restaurant parsing (dining search results are restaurants).
 * - **food / style**: Attempts product parsing (Instamart search results are products).
 *
 * Returns `null` if the tool name does not match the search pattern or no parser succeeds.
 */
function tryParseSearchRoute(
  toolName: string,
  payload: unknown,
  verticalId: string,
  productParseContext: { toolInput?: Record<string, unknown>; maxItems?: number },
  restaurantParseContext: { maxItems?: number },
  renderContext: ToolRenderContext | undefined,
  enableRelevanceReranking: boolean,
): ParsedToolResult | null {
  if (!SEARCH_TOOL_RE.test(toolName)) return null;

  if (verticalId === "foodorder") {
    const signals = inferPayloadSignals(payload);

    if (shouldPreferFoodorderProducts(toolName, signals)) {
      const products = tryParseProducts(payload, productParseContext);
      if (products) {
        return withPostProcess(
          products,
          toolName,
          verticalId,
          renderContext,
          enableRelevanceReranking,
        );
      }
    }

    if (shouldParseFoodorderRestaurants(toolName, signals)) {
      const restaurants = tryParseRestaurants(payload, restaurantParseContext);
      if (restaurants) {
        return withPostProcess(
          restaurants,
          toolName,
          verticalId,
          renderContext,
          enableRelevanceReranking,
        );
      }
    }

    const products = tryParseProducts(payload, productParseContext);
    if (products) {
      return withPostProcess(
        products,
        toolName,
        verticalId,
        renderContext,
        enableRelevanceReranking,
      );
    }

    const restaurants = tryParseRestaurants(payload, restaurantParseContext);
    if (restaurants) {
      return withPostProcess(
        restaurants,
        toolName,
        verticalId,
        renderContext,
        enableRelevanceReranking,
      );
    }

    return null;
  }

  if (verticalId === "dining") {
    const restaurants = tryParseRestaurants(payload, restaurantParseContext);
    if (restaurants) {
      return withPostProcess(
        restaurants,
        toolName,
        verticalId,
        renderContext,
        enableRelevanceReranking,
      );
    }
  }

  const products = tryParseProducts(payload, productParseContext);
  if (products) {
    return withPostProcess(
      products,
      toolName,
      verticalId,
      renderContext,
      enableRelevanceReranking,
    );
  }

  return null;
}

/**
 * Handles MCP responses that wrap cart data inside a status-like envelope
 * (objects with `success` or `message` fields). This is needed because some
 * cart-mutating tools (add/remove item) return the updated cart embedded in
 * a status wrapper rather than as a top-level cart payload.
 *
 * Returns `null` if the data is not an object or lacks status indicators.
 */
function tryParseEmbeddedStatusCart(
  data: unknown,
  toolName: string,
  verticalId: string,
  renderContext: ToolRenderContext | undefined,
  enableRelevanceReranking: boolean,
): ParsedToolResult | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null;

  const dataObj = data as Record<string, unknown>;
  if (dataObj.success == null && dataObj.message == null) return null;

  const embeddedCart = tryParseCart(data);
  if (!embeddedCart) return null;

  return withPostProcess(
    embeddedCart,
    toolName,
    verticalId,
    renderContext,
    enableRelevanceReranking,
  );
}

/**
 * Main entry point for parsing MCP tool-result content into typed card models.
 *
 * Examines the tool name and payload structure to route through parsers in
 * priority order: search -> cart -> slot -> address -> confirm -> embedded cart
 * -> shape detect -> status -> info -> raw.
 *
 * When a render context is available, relevance reranking is applied via
 * `postProcessParsedResult`, which uses enlarged candidate pools and
 * strict-first sorting for dining and foodorder verticals.
 *
 * **Contract**: Always returns a valid `ParsedToolResult`. Never throws.
 * Exceptions are caught and produce `{ type: "raw", content }`.
 *
 * @param toolName - The MCP tool name (used for regex-based routing).
 * @param content - Raw tool-result content from the Anthropic stream.
 * @param verticalId - Active vertical (`food`, `style`, `dining`, `foodorder`).
 * @param toolInput - Original tool input params (passed to product parser for context).
 * @param renderContext - Optional context carrying the latest query and strict constraints.
 * @returns A typed `ParsedToolResult` for card rendering.
 */
export function parseToolResult(
  toolName: string,
  content: unknown,
  verticalId: string,
  toolInput?: Record<string, unknown>,
  renderContext?: ToolRenderContext,
): ParsedToolResult {
  try {
    const enableRelevanceReranking = shouldEnableRelevanceReranking(
      verticalId,
      renderContext,
    );

    const data = unwrapContent(content);
    const payload = extractPayload(data);

    const productParseContext = {
      toolInput,
      maxItems:
        verticalId === "foodorder"
          ? (
              enableRelevanceReranking
                ? FOODORDER_MENU_CANDIDATES
                : MAX_MENU_PRODUCTS_SHOWN
            )
          : undefined,
    };

    const restaurantParseContext = {
      maxItems:
        verticalId === "dining" && enableRelevanceReranking
          ? DINING_RESTAURANT_CANDIDATES
          : verticalId === "foodorder" && enableRelevanceReranking
            ? FOODORDER_RESTAURANT_CANDIDATES
            : undefined,
    };

    const searchResult = tryParseSearchRoute(
      toolName,
      payload,
      verticalId,
      productParseContext,
      restaurantParseContext,
      renderContext,
      enableRelevanceReranking,
    );
    if (searchResult) return searchResult;

    if (CART_TOOL_RE.test(toolName)) {
      const cart = tryParseCart(data) || tryParseCart(payload);
      logger.debug("[parseToolResult] Cart tool matched", {
        toolName,
        hasItems: Boolean(cart),
        dataKeys:
          typeof data === "object" && data
            ? Object.keys(data as Record<string, unknown>)
            : "not-object",
      });
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

    const embeddedCart = tryParseEmbeddedStatusCart(
      data,
      toolName,
      verticalId,
      renderContext,
      enableRelevanceReranking,
    );
    if (embeddedCart) return embeddedCart;

    const shaped = detectByShape(payload, verticalId, toolName);
    if (shaped) {
      return withPostProcess(
        shaped,
        toolName,
        verticalId,
        renderContext,
        enableRelevanceReranking,
      );
    }

    const statusFromData = tryParseStatus(data);
    if (statusFromData) return statusFromData;

    const statusFromPayload = tryParseStatus(payload);
    if (statusFromPayload) return statusFromPayload;

    const info = tryParseInfo(data);
    if (info) {
      return withPostProcess(
        info,
        toolName,
        verticalId,
        renderContext,
        enableRelevanceReranking,
      );
    }

    const result: ParsedToolResult = { type: "raw", content };
    logger.debug(`parseToolResult: tool="${toolName}" vertical="${verticalId}" → ${result.type}`);
    return result;
  } catch (err) {
    logger.warn("parseToolResult failed, falling back to raw", { toolName, err });
    return { type: "raw", content };
  }
}
