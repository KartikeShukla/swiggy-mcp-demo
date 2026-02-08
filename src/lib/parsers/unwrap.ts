import { PAYLOAD_EXTRACT_MAX_DEPTH } from "@/lib/constants";

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
    ]) {
      if (key in obj && obj[key] != null) {
        return extractPayload(obj[key], depth + 1);
      }
    }
  }
  return content;
}
