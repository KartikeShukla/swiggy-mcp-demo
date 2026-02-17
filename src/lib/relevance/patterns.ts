/** Shared pattern registries for constraint detection across dining and foodorder verticals. */

export interface PatternEntry {
  key: string;
  pattern: RegExp;
}

export interface DishPatternEntry extends PatternEntry {
  cuisineProxy?: string;
}

/** Unified cuisine patterns covering both dining and foodorder verticals. */
export const CUISINE_PATTERNS: PatternEntry[] = [
  { key: "south indian", pattern: /\b(south[\s-]?indian|udupi|andhra|chettinad|kerala)\b/ },
  { key: "north indian", pattern: /\b(north[\s-]?indian|punjabi|mughlai|rajasthani|lucknowi|awadhi)\b/ },
  { key: "italian", pattern: /\b(italian|pasta|pizza)\b/ },
  { key: "asian", pattern: /\b(asian|japanese|thai|korean|sushi|ramen)\b/ },
  { key: "chinese", pattern: /\b(chinese|hakka|schezwan)\b/ },
  { key: "continental", pattern: /\b(continental|european|global cuisine)\b/ },
  { key: "mexican", pattern: /\b(mexican|taco|burrito)\b/ },
  { key: "middle eastern", pattern: /\b(middle[\s-]?eastern|arabic|lebanese|turkish)\b/ },
  { key: "bengali", pattern: /\b(bengali|kolkata)\b/ },
  { key: "hyderabadi", pattern: /\b(hyderabadi|hyderabad)\b/ },
  { key: "biryani", pattern: /\b(biryani|pulao)\b/ },
];

/** Unified dish patterns with optional cuisine proxy mapping for dining. */
export const DISH_PATTERNS: DishPatternEntry[] = [
  { key: "dosa", pattern: /\b(dosa|dosai)\b/, cuisineProxy: "south indian" },
  { key: "idli", pattern: /\b(idli)\b/, cuisineProxy: "south indian" },
  { key: "uttapam", pattern: /\b(uttapam|uthappam)\b/, cuisineProxy: "south indian" },
  { key: "biryani", pattern: /\b(biryani|pulao)\b/, cuisineProxy: "north indian" },
  { key: "pizza", pattern: /\b(pizza)\b/, cuisineProxy: "italian" },
  { key: "pasta", pattern: /\b(pasta)\b/, cuisineProxy: "italian" },
  { key: "sushi", pattern: /\b(sushi)\b/, cuisineProxy: "asian" },
  { key: "ramen", pattern: /\b(ramen)\b/, cuisineProxy: "asian" },
  { key: "burger", pattern: /\b(burger|burgers)\b/ },
  { key: "butter chicken", pattern: /\b(butter\s+chicken)\b/, cuisineProxy: "north indian" },
  { key: "paneer tikka", pattern: /\b(paneer\s+tikka(?:\s+masala)?)\b/, cuisineProxy: "north indian" },
  { key: "dal makhani", pattern: /\b(dal\s+makhani)\b/, cuisineProxy: "north indian" },
  { key: "chole bhature", pattern: /\b(chole\s+bhature|chole\s+bhatura)\b/, cuisineProxy: "north indian" },
  { key: "thali", pattern: /\b(thali)\b/ },
  { key: "momos", pattern: /\b(momos?)\b/ },
  { key: "sandwich", pattern: /\b(sandwich|sandwiches)\b/ },
  { key: "kebab", pattern: /\b(kebab|kebabs)\b/, cuisineProxy: "north indian" },
  { key: "shawarma", pattern: /\b(shawarma)\b/, cuisineProxy: "middle eastern" },
];

/** Budget extraction pattern — matches "under ₹500", "below 1000", etc. */
export const BUDGET_RE = /\b(under|below|upto|up to|within|around)\s*₹?\s*(\d{2,5})\b/i;

/** Broadening signal — user explicitly asking to relax filters. */
export const BROADEN_RE = /\b(broaden|show more|anything|any place|open to|relax|wider|widen|no strict)\b/i;

/** Detect a cuisine from query text using the shared patterns. */
export function detectCuisines(query: string): string[] {
  const values: string[] = [];
  for (const { key, pattern } of CUISINE_PATTERNS) {
    if (pattern.test(query)) values.push(key);
  }
  return values;
}

/** Detect dishes from query text and return associated cuisine proxies. */
export function detectDishesWithProxy(query: string): {
  dishes: string[];
  cuisineProxy: string[];
} {
  const dishes: string[] = [];
  const cuisineProxy: string[] = [];
  for (const { key, pattern, cuisineProxy: proxy } of DISH_PATTERNS) {
    if (!pattern.test(query)) continue;
    dishes.push(key);
    if (proxy) cuisineProxy.push(proxy);
  }
  return { dishes, cuisineProxy };
}

/** Detect dishes from query text (keys only, no cuisine proxy). */
export function detectDishes(query: string): string[] {
  const dishes: string[] = [];
  for (const { key, pattern } of DISH_PATTERNS) {
    if (pattern.test(query)) dishes.push(key);
  }
  return dishes;
}

/** Extract budget from query text (e.g. "under 500" → 500). */
export function detectBudget(queryText: string): number | undefined {
  const match = queryText.match(BUDGET_RE);
  if (!match?.[2]) return undefined;
  const parsed = Number.parseInt(match[2], 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}
