import { PAYLOAD_EXTRACT_MAX_DEPTH } from "@/lib/constants";
import { asArray } from "./primitives";

/** Attempt to parse a string as JSON; return original string on failure. */
export function tryParseJSON(str: string): unknown {
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
export function unwrapContent(content: unknown): unknown {
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

/**
 * Recursively unwrap common wrapper keys (data, results, items, etc.)
 * to find the actual payload array or object. Stops at PAYLOAD_EXTRACT_MAX_DEPTH.
 */
export function extractPayload(content: unknown, depth = 0): unknown {
  if (depth > PAYLOAD_EXTRACT_MAX_DEPTH) return content;
  if (Array.isArray(content)) return content;
  if (typeof content === "object" && content !== null) {
    const obj = content as Record<string, unknown>;
    for (const key of [
      "data", "results", "items", "products", "restaurants", "menu",
      "dishes", "addresses", "cart", "cart_items", "slots",
      "menu_items", "menu_categories", "listings", "options",
    ]) {
      if (key in obj && obj[key] != null) {
        return extractPayload(obj[key], depth + 1);
      }
    }

    // Special case: menu categories with nested items
    if ("categories" in obj && obj.categories != null) {
      const cats = asArray(obj.categories);
      if (cats) {
        const flattened = flattenCategoryItems(cats);
        if (flattened.length > 0) return flattened;
      }
    }
  }
  return content;
}

/** Flatten category arrays like [{ name: "Starters", items: [...] }] into a single items array. */
export function flattenCategoryItems(categories: unknown[]): unknown[] {
  const items: unknown[] = [];
  for (const cat of categories) {
    if (typeof cat !== "object" || cat === null) continue;
    const catObj = cat as Record<string, unknown>;
    const catItems = asArray(catObj.items) || asArray(catObj.dishes) || asArray(catObj.itemCards) || asArray(catObj.products);
    if (catItems) {
      for (const item of catItems) {
        if (typeof item === "object" && item !== null) {
          const itemObj = item as Record<string, unknown>;
          // Handle Swiggy-style double-nested: { card: { info: { name, price, ... } } }
          if (typeof itemObj.card === "object" && itemObj.card !== null) {
            const card = itemObj.card as Record<string, unknown>;
            if (typeof card.info === "object" && card.info !== null) {
              items.push(card.info);
              continue;
            }
          }
          items.push(item);
        }
      }
    }
  }
  return items;
}
