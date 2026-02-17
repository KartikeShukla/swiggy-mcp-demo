export const MAX_TOOL_RESULT_CHARS = 3000;

/**
 * Known top-level and nested object keys that wrap the main item array in
 * MCP tool result JSON.  Used by `findItemsArray` to drill into the
 * response structure and locate the array of scorable items (up to 2 levels deep).
 */
const WRAPPER_KEYS = [
  "data", "results", "items", "products", "restaurants", "menu",
  "dishes", "addresses", "cart", "cart_items", "slots",
  "menu_items", "listings", "options",
];

/**
 * Item-level fields whose string values are extracted and matched against
 * query terms during relevance scoring.  Covers common naming patterns
 * across Swiggy verticals (product names, brands, cuisines, categories,
 * locality info, etc.).
 */
const SEARCHABLE_ITEM_FIELDS = [
  "name", "displayName", "product_name", "title",
  "brand", "brand_name",
  "description", "desc",
  "item_type", "product_type", "category", "sub_category", "subCategory",
  "cuisine", "cuisines",
  "requirement", "menu_category", "restaurant_name",
  "locality", "area", "areaName", "area_name",
];

/**
 * Keys checked (in priority order) on `mcp_tool_use.input` to extract the
 * user's original search query.  The first key found with a string value
 * is split into lowercase terms for relevance scoring.
 */
const QUERY_INPUT_KEYS = [
  "query", "q", "search", "search_text", "searchText",
  "term", "keyword", "requirement", "category",
  "item_type", "itemType",
];

interface FindResult {
  items: unknown[];
  rebuild: (arr: unknown[]) => unknown;
}

function findItemsArray(parsed: unknown, depth = 0): FindResult | null {
  if (depth > 2) return null;

  if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object" && parsed[0] !== null) {
    return { items: parsed, rebuild: (arr) => arr };
  }

  if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    for (const key of WRAPPER_KEYS) {
      if (!(key in obj)) continue;
      const inner = findItemsArray(obj[key], depth + 1);
      if (inner) {
        return {
          items: inner.items,
          rebuild: (arr) => ({ ...obj, [key]: inner.rebuild(arr) }),
        };
      }
    }
  }

  return null;
}

function extractSearchableText(item: unknown): string {
  if (typeof item !== "object" || item === null) return "";
  const obj = item as Record<string, unknown>;
  const parts: string[] = [];
  for (const field of SEARCHABLE_ITEM_FIELDS) {
    const val = obj[field];
    if (typeof val === "string") {
      parts.push(val);
    } else if (Array.isArray(val)) {
      for (const v of val) {
        if (typeof v === "string") parts.push(v);
      }
    }
  }
  return parts.join(" ").toLowerCase();
}

function scoreItem(item: unknown, queryTerms: string[]): number {
  if (queryTerms.length === 0) return 0;
  const text = extractSearchableText(item);
  let score = 0;
  for (const term of queryTerms) {
    if (text.includes(term)) score++;
  }
  return score;
}

/**
 * Extracts search query terms from an MCP tool_use input object.
 *
 * Checks `QUERY_INPUT_KEYS` in order and returns the first string value
 * found, split into lowercase tokens (filtering out single-char tokens).
 * Returns an empty array if no query field is present.
 */
export function extractQueryFromToolInput(input: Record<string, unknown> | undefined): string[] {
  if (!input) return [];
  for (const key of QUERY_INPUT_KEYS) {
    const val = input[key];
    if (typeof val !== "string") continue;
    return val
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1);
  }
  return [];
}

/**
 * Truncates a JSON tool result string to fit within `maxChars` while
 * preserving the most query-relevant items.
 *
 * **Strategy:**
 * 1. Parses the JSON and locates the main item array via `WRAPPER_KEYS`.
 * 2. Scores each item by counting how many `queryTerms` appear in its
 *    `SEARCHABLE_ITEM_FIELDS`.
 * 3. Sorts items by score (descending), breaking ties by original index.
 * 4. Greedily selects items that fit within the character budget
 *    (accounting for wrapper overhead and comma separators).
 * 5. Re-sorts selected items by original index to preserve natural order.
 * 6. Rebuilds the JSON with the wrapper structure intact.
 *
 * Falls back to a simple `slice(0, maxChars)` if the JSON cannot be
 * parsed or no item array is found.
 */
export function smartTruncateJsonContent(
  jsonText: string,
  queryTerms: string[],
  maxChars: number = MAX_TOOL_RESULT_CHARS,
): string {
  if (jsonText.length <= maxChars) return jsonText;

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return jsonText.slice(0, maxChars);
  }

  const found = findItemsArray(parsed);
  if (!found) return jsonText.slice(0, maxChars);

  const { items, rebuild } = found;

  const scored = items.map((item, index) => ({
    item,
    index,
    score: scoreItem(item, queryTerms),
  }));

  scored.sort((a, b) => b.score - a.score || a.index - b.index);

  const wrapperOverhead = JSON.stringify(rebuild([])).length;
  let budget = maxChars - wrapperOverhead;
  const selected: Array<{ item: unknown; index: number }> = [];

  for (const entry of scored) {
    const serialized = JSON.stringify(entry.item);
    const commaOverhead = selected.length > 0 ? 1 : 0;
    const cost = serialized.length + commaOverhead;
    if (cost > budget) continue;
    budget -= cost;
    selected.push({ item: entry.item, index: entry.index });
  }

  if (selected.length === 0) return jsonText.slice(0, maxChars);

  selected.sort((a, b) => a.index - b.index);
  return JSON.stringify(rebuild(selected.map((s) => s.item)));
}
