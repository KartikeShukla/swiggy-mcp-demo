import type { ParsedToolResult, RelevanceDebugTrace, ToolRenderContext } from "@/lib/types";
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
import { asArrayOrWrap } from "./primitives";
import { rerankFoodorderMenuItems, rerankFoodorderRestaurants } from "@/lib/relevance/foodorder";
import { rerankProductsByQuery, rerankRestaurantsByQuery } from "@/lib/relevance/generic";

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
const FOODORDER_MENU_CANDIDATES = 15;
const FOODORDER_RESTAURANT_CANDIDATES = 15;

function attachDebug<T extends ParsedToolResult>(result: T, debug?: RelevanceDebugTrace): T {
  if (!debug) return result;
  return { ...result, debug } as T;
}

function buildStrictMatchInfo(
  title: string,
  note: string,
  renderContext?: ToolRenderContext,
  debug?: RelevanceDebugTrace,
): ParsedToolResult {
  const filters = renderContext?.strictConstraints
    ? [
        renderContext.strictConstraints.cuisines?.length
          ? `cuisine: ${renderContext.strictConstraints.cuisines.join(", ")}`
          : "",
        renderContext.strictConstraints.dishes?.length
          ? `dish: ${renderContext.strictConstraints.dishes.join(", ")}`
          : "",
        renderContext.strictConstraints.diet ? `diet: ${renderContext.strictConstraints.diet}` : "",
        renderContext.strictConstraints.spicy ? "spice: spicy" : "",
      ]
        .filter(Boolean)
        .join(" | ")
    : "";

  return {
    type: "info",
    title,
    entries: [
      {
        key: "Current filters",
        value: filters || "Strict preference matching is active.",
      },
      {
        key: "Next step",
        value: note,
      },
    ],
    debug,
  };
}

function postProcessParsedResult(
  parsed: ParsedToolResult,
  toolName: string,
  verticalId: string,
  renderContext: ToolRenderContext | undefined,
  enableRelevancePostProcessing: boolean,
): ParsedToolResult {
  if (!enableRelevancePostProcessing || parsed.type === "raw") return parsed;
  const query = renderContext?.latestUserQuery ?? "";

  if (verticalId === "foodorder") {
    const mode = renderContext?.mode ?? (MENU_INTENT_TOOL_RE.test(toolName) ? "menu" : "discover");

    if (parsed.type === "restaurants") {
      const ranked = rerankFoodorderRestaurants(parsed.items, renderContext);
      logger.debug("[Parser Relevance]", {
        verticalId,
        mode,
        type: "restaurants",
        toolName,
        debug: ranked.debug,
      });
      if (ranked.requireBroadenPrompt) {
        return buildStrictMatchInfo(
          "No strict restaurant matches yet",
          "Say 'broaden results' to relax one filter, or refine with a specific area/budget.",
          renderContext,
          ranked.debug,
        );
      }
      return {
        type: "restaurants",
        items: ranked.items,
        debug: ranked.debug,
      };
    }

    if (parsed.type === "products" && mode === "menu") {
      const ranked = rerankFoodorderMenuItems(parsed.items, renderContext);
      logger.debug("[Parser Relevance]", {
        verticalId,
        mode,
        type: "products",
        toolName,
        debug: ranked.debug,
      });
      if (ranked.requireBroadenPrompt) {
        return buildStrictMatchInfo(
          "No strict menu matches yet",
          "Say 'broaden menu' to relax one filter, or name another dish/cuisine.",
          renderContext,
          ranked.debug,
        );
      }
      return {
        type: "products",
        items: ranked.items,
        debug: ranked.debug,
      };
    }

    if (parsed.type === "products" && query) {
      const rerankedItems = rerankProductsByQuery(parsed.items, query);
      logger.debug("[Parser Relevance]", {
        verticalId,
        mode,
        type: "products",
        toolName,
        before: parsed.items.length,
        after: rerankedItems.length,
      });
      return attachDebug(
        {
          type: "products",
          items: rerankedItems,
        },
        {
          strategy: "foodorder:discover-products",
          query,
          mode,
          beforeCount: parsed.items.length,
          afterCount: rerankedItems.length,
        },
      );
    }
  }

  if ((verticalId === "food" || verticalId === "style") && parsed.type === "products" && query) {
    const rerankedItems = rerankProductsByQuery(parsed.items, query);
    logger.debug("[Parser Relevance]", {
      verticalId,
      type: "products",
      toolName,
      before: parsed.items.length,
      after: rerankedItems.length,
    });
    return attachDebug(
      {
        type: "products",
        items: rerankedItems,
      },
      {
        strategy: `${verticalId}:products`,
        query,
        mode: renderContext?.mode,
        beforeCount: parsed.items.length,
        afterCount: rerankedItems.length,
      },
    );
  }

  if (verticalId === "dining" && parsed.type === "restaurants" && query) {
    const rerankedItems = rerankRestaurantsByQuery(parsed.items, query);
    logger.debug("[Parser Relevance]", {
      verticalId,
      type: "restaurants",
      toolName,
      before: parsed.items.length,
      after: rerankedItems.length,
    });
    return attachDebug(
      {
        type: "restaurants",
        items: rerankedItems,
      },
      {
        strategy: "dining:restaurants",
        query,
        mode: renderContext?.mode,
        beforeCount: parsed.items.length,
        afterCount: rerankedItems.length,
      },
    );
  }

  return parsed;
}

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
  renderContext?: ToolRenderContext,
): ParsedToolResult {
  try {
    const enableRelevancePostProcessing = false;
    const data = unwrapContent(content);
    const payload = extractPayload(data);
    const productParseContext = {
      toolInput,
      maxItems:
        verticalId === "foodorder"
          ? (
              enableRelevancePostProcessing && renderContext
                ? FOODORDER_MENU_CANDIDATES
                : MAX_MENU_PRODUCTS_SHOWN
            )
          : undefined,
    };
    const restaurantParseContext = {
      maxItems:
        verticalId === "foodorder" && enableRelevancePostProcessing && renderContext
          ? FOODORDER_RESTAURANT_CANDIDATES
          : undefined,
    };

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
          const products = tryParseProducts(payload, productParseContext);
          if (products) {
            return postProcessParsedResult(
              products,
              toolName,
              verticalId,
              renderContext,
              enableRelevancePostProcessing,
            );
          }
        }

        if (signals.hasStrongRestaurantSignals || (signals.hasWeakRestaurantSignals && isRestaurantDiscoveryTool)) {
          const restaurants = tryParseRestaurants(payload, restaurantParseContext);
          if (restaurants) {
            return postProcessParsedResult(
              restaurants,
              toolName,
              verticalId,
              renderContext,
              enableRelevancePostProcessing,
            );
          }
        }

        const products = tryParseProducts(payload, productParseContext);
        if (products) {
          return postProcessParsedResult(
            products,
            toolName,
            verticalId,
            renderContext,
            enableRelevancePostProcessing,
          );
        }
        const restaurants = tryParseRestaurants(payload, restaurantParseContext);
        if (restaurants) {
          return postProcessParsedResult(
            restaurants,
            toolName,
            verticalId,
            renderContext,
            enableRelevancePostProcessing,
          );
        }
      }

      if (verticalId === "dining") {
        const restaurants = tryParseRestaurants(payload, restaurantParseContext);
        if (restaurants) {
          return postProcessParsedResult(
            restaurants,
            toolName,
            verticalId,
            renderContext,
            enableRelevancePostProcessing,
          );
        }
      }

      // Always try products (including dining — dining can have menu/dish searches)
      const products = tryParseProducts(payload, productParseContext);
      if (products) {
        return postProcessParsedResult(
          products,
          toolName,
          verticalId,
          renderContext,
          enableRelevancePostProcessing,
        );
      }
    }
    if (CART_TOOL_RE.test(toolName)) {
      // Try original data first (before extractPayload strips the structure)
      // so we preserve lineItems / bill breakdown alongside cart items
      const cart = tryParseCart(data) || tryParseCart(payload);
      logger.debug("[parseToolResult] Cart tool matched", {
        toolName,
        hasItems: Boolean(cart),
        dataKeys: typeof data === "object" && data ? Object.keys(data as Record<string, unknown>) : "not-object",
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

    // Before shape detection, check if data is a status-like response with embedded cart
    // (e.g. { success: true, message: "Added", cart: { items: [...] } })
    // Without this check, extractPayload would pull out the cart items and shape detection
    // would render them as products instead of a cart card.
    if (typeof data === "object" && data !== null && !Array.isArray(data)) {
      const dataObj = data as Record<string, unknown>;
      if (dataObj.success != null || dataObj.message != null) {
        const embeddedCart = tryParseCart(data);
        if (embeddedCart) {
          return postProcessParsedResult(
            embeddedCart,
            toolName,
            verticalId,
            renderContext,
            enableRelevancePostProcessing,
          );
        }
      }
    }

    // Fall back to shape detection
    const shaped = detectByShape(payload, verticalId, toolName);
    if (shaped) {
      return postProcessParsedResult(
        shaped,
        toolName,
        verticalId,
        renderContext,
        enableRelevancePostProcessing,
      );
    }

    // Try status on pre-extracted data (has success/message at top level)
    const statusFromData = tryParseStatus(data);
    if (statusFromData) return statusFromData;

    // Try status on extracted payload
    const statusFromPayload = tryParseStatus(payload);
    if (statusFromPayload) return statusFromPayload;

    // Catch-all: any non-empty object becomes an info card
    const info = tryParseInfo(data);
    if (info) {
      return postProcessParsedResult(
        info,
        toolName,
        verticalId,
        renderContext,
        enableRelevancePostProcessing,
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
