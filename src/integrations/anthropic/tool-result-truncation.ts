export const MAX_TOOL_RESULT_CHARS = 3000;

const WRAPPER_KEYS = [
  "data", "results", "items", "products", "restaurants", "menu",
  "dishes", "addresses", "cart", "cart_items", "slots",
  "menu_items", "listings", "options",
];

const SEARCHABLE_ITEM_FIELDS = [
  "name", "displayName", "product_name", "title",
  "brand", "brand_name",
  "description", "desc",
  "item_type", "product_type", "category", "sub_category", "subCategory",
  "cuisine", "cuisines",
  "requirement", "menu_category", "restaurant_name",
  "locality", "area", "areaName", "area_name",
];

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
