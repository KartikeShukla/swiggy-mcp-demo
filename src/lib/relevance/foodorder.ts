import type {
  ParsedProduct,
  ParsedRestaurant,
  StrictConstraintSnapshot,
  ToolRenderContext,
} from "@/lib/types";
import { MAX_MENU_PRODUCTS_SHOWN, MAX_RESTAURANTS_SHOWN } from "@/lib/constants";
import { extractNumberFromText, normalizeText, textOverlapScore, tokenizeQuery } from "./text";
import { unique, rankItems, buildRelevanceDebug, type RelevanceResult } from "./shared";
import {
  detectCuisines as sharedDetectCuisines,
  detectDishes as sharedDetectDishes,
  detectBudget,
  BROADEN_RE,
} from "./patterns";

export type { RelevanceResult };

// ── Foodorder-specific patterns ───────────────────────────────────────

const SPICY_RE = /\b(spicy|extra spicy|hot|fiery|schezwan|andhra|chettinad|kolhapuri)\b/;
const VEG_RE = /\b(veg|vegetarian|pure veg|satvik|jain)\b/;
const NON_VEG_RE = /\b(non[\s-]?veg|chicken|mutton|fish|prawn|egg)\b/;
const VEGAN_RE = /\b(vegan)\b/;
const SPEED_RE = /\b(under|within)\s*(\d{1,2})\s*(min|mins|minutes)\b/;

type DietPref = "veg" | "non_veg" | "vegan";

// ── Constraint extraction ─────────────────────────────────────────────

export interface FoodorderConstraintState extends StrictConstraintSnapshot {
  queryTerms: string[];
  rawQuery: string;
}

function detectDiet(query: string): DietPref | undefined {
  if (VEGAN_RE.test(query)) return "vegan";
  if (NON_VEG_RE.test(query)) return "non_veg";
  if (VEG_RE.test(query)) return "veg";
  return undefined;
}

function detectSpeedMins(query: string): number | undefined {
  const match = query.match(SPEED_RE);
  if (!match?.[2]) return undefined;
  const parsed = Number.parseInt(match[2], 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function extractFoodorderConstraints(queryText: string): FoodorderConstraintState {
  const query = normalizeText(queryText);
  const constraints: FoodorderConstraintState = {
    rawQuery: queryText,
    queryTerms: tokenizeQuery(queryText),
  };
  const cuisines = sharedDetectCuisines(query);
  if (cuisines.length > 0) constraints.cuisines = cuisines;
  const dishes = sharedDetectDishes(query);
  if (dishes.length > 0) constraints.dishes = dishes;
  const diet = detectDiet(query);
  if (diet) constraints.diet = diet;
  const budget = detectBudget(query);
  if (budget != null) constraints.budgetMax = budget;
  const speed = detectSpeedMins(query);
  if (speed != null) constraints.maxDeliveryMins = speed;
  if (SPICY_RE.test(query)) constraints.spicy = true;
  return constraints;
}

export function shouldAllowBroadening(queryText: string): boolean {
  return BROADEN_RE.test(queryText.toLowerCase());
}

// ── Text helpers ──────────────────────────────────────────────────────

function getRestaurantText(item: ParsedRestaurant): string {
  return normalizeText(
    [
      item.name,
      item.cuisine,
      item.locality,
      item.address,
      ...(item.offers ?? []),
      item.priceForTwo,
      item.deliveryTime,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function getProductText(item: ParsedProduct): string {
  return normalizeText(
    [
      item.name,
      item.brand,
      item.itemType,
      item.description,
      item.groupLabel,
      item.sourceQuery,
      item.restaurantName,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function getProductStrictText(item: ParsedProduct): string {
  return normalizeText(
    [
      item.name,
      item.brand,
      item.itemType,
      item.description,
      item.restaurantName,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

// ── Matching helpers ──────────────────────────────────────────────────

function matchesCuisine(text: string, cuisines?: string[]): boolean {
  if (!cuisines || cuisines.length === 0) return true;
  return cuisines.some((value) => text.includes(value));
}

function matchesDish(text: string, dishes?: string[]): boolean {
  if (!dishes || dishes.length === 0) return true;
  return dishes.some((value) => text.includes(value));
}

function matchesDiet(text: string, diet?: DietPref): boolean {
  if (!diet) return true;
  if (diet === "vegan") return VEGAN_RE.test(text);
  if (diet === "veg") return VEG_RE.test(text) || VEGAN_RE.test(text);
  return NON_VEG_RE.test(text);
}

function matchesSpicy(text: string, spicy?: boolean): boolean {
  if (!spicy) return true;
  return SPICY_RE.test(text);
}

// ── Strict key resolution ─────────────────────────────────────────────

function resolveStrictKeysForRestaurants(
  items: ParsedRestaurant[],
  constraints: FoodorderConstraintState,
): string[] {
  const keys: string[] = [];
  const cuisineTextExists = items.some((item) => Boolean(item.cuisine));
  if (constraints.cuisines?.length && cuisineTextExists) keys.push("cuisine");
  if (constraints.dishes?.length && items.some((item) => matchesDish(getRestaurantText(item), constraints.dishes))) {
    keys.push("dish");
  }
  if (constraints.spicy && items.some((item) => matchesSpicy(getRestaurantText(item), true))) {
    keys.push("spicy");
  }
  if (constraints.diet && items.some((item) => matchesDiet(getRestaurantText(item), constraints.diet))) {
    keys.push("diet");
  }
  if (constraints.budgetMax != null && items.some((item) => extractNumberFromText(item.priceForTwo) != null)) {
    keys.push("budget");
  }
  if (constraints.maxDeliveryMins != null && items.some((item) => extractNumberFromText(item.deliveryTime) != null)) {
    keys.push("speed");
  }
  return keys;
}

function resolveStrictKeysForProducts(
  items: ParsedProduct[],
  constraints: FoodorderConstraintState,
): string[] {
  const keys: string[] = [];
  if (constraints.cuisines?.length) keys.push("cuisine");
  if (constraints.dishes?.length) keys.push("dish");
  if (constraints.spicy) keys.push("spicy");
  if (constraints.diet) keys.push("diet");
  if (constraints.budgetMax != null && items.some((item) => typeof item.price === "number")) {
    keys.push("budget");
  }
  return keys;
}

// ── Scoring ───────────────────────────────────────────────────────────

function scoreRestaurant(item: ParsedRestaurant, constraints: FoodorderConstraintState): number {
  const text = getRestaurantText(item);
  let score = textOverlapScore(text, constraints.queryTerms);
  if (matchesCuisine(text, constraints.cuisines)) score += 8;
  if (matchesDish(text, constraints.dishes)) score += 7;
  if (matchesSpicy(text, constraints.spicy)) score += 4;
  if (matchesDiet(text, constraints.diet as DietPref | undefined)) score += 4;
  const price = extractNumberFromText(item.priceForTwo);
  if (constraints.budgetMax != null && price != null && price <= constraints.budgetMax) score += 3;
  const delivery = extractNumberFromText(item.deliveryTime);
  if (constraints.maxDeliveryMins != null && delivery != null && delivery <= constraints.maxDeliveryMins) score += 3;
  if (typeof item.rating === "number") score += Math.max(0, item.rating - 3);
  return score;
}

function scoreProduct(item: ParsedProduct, constraints: FoodorderConstraintState): number {
  const text = getProductText(item);
  let score = textOverlapScore(text, constraints.queryTerms);
  if (matchesCuisine(text, constraints.cuisines)) score += 8;
  if (matchesDish(text, constraints.dishes)) score += 9;
  if (matchesSpicy(text, constraints.spicy)) score += 4;
  if (matchesDiet(text, constraints.diet as DietPref | undefined)) score += 4;
  if (constraints.budgetMax != null && typeof item.price === "number" && item.price <= constraints.budgetMax) {
    score += 3;
  }
  if (item.available === true) score += 1;
  return score;
}

// ── Strict matching ───────────────────────────────────────────────────

function restaurantStrictMatch(
  item: ParsedRestaurant,
  constraints: FoodorderConstraintState,
  strictKeys: string[],
): boolean {
  const text = getRestaurantText(item);
  for (const key of strictKeys) {
    if (key === "cuisine" && !matchesCuisine(text, constraints.cuisines)) return false;
    if (key === "dish" && !matchesDish(text, constraints.dishes)) return false;
    if (key === "spicy" && !matchesSpicy(text, constraints.spicy)) return false;
    if (key === "diet" && !matchesDiet(text, constraints.diet as DietPref | undefined)) return false;
    if (
      key === "budget" &&
      constraints.budgetMax != null &&
      (extractNumberFromText(item.priceForTwo) ?? Number.POSITIVE_INFINITY) > constraints.budgetMax
    ) {
      return false;
    }
    if (
      key === "speed" &&
      constraints.maxDeliveryMins != null &&
      (extractNumberFromText(item.deliveryTime) ?? Number.POSITIVE_INFINITY) > constraints.maxDeliveryMins
    ) {
      return false;
    }
  }
  return true;
}

function productStrictMatch(
  item: ParsedProduct,
  constraints: FoodorderConstraintState,
  strictKeys: string[],
): boolean {
  const text = getProductStrictText(item);
  for (const key of strictKeys) {
    if (key === "cuisine" && !matchesCuisine(text, constraints.cuisines)) return false;
    if (key === "dish" && !matchesDish(text, constraints.dishes)) return false;
    if (key === "spicy" && !matchesSpicy(text, constraints.spicy)) return false;
    if (key === "diet" && !matchesDiet(text, constraints.diet as DietPref | undefined)) return false;
    if (
      key === "budget" &&
      constraints.budgetMax != null &&
      (item.price ?? Number.POSITIVE_INFINITY) > constraints.budgetMax
    ) {
      return false;
    }
  }
  return true;
}

// ── Restaurant lock scoping ───────────────────────────────────────────

function matchLockedRestaurant(items: ParsedProduct[], lockedRestaurant?: string | null): ParsedProduct[] {
  if (!lockedRestaurant) return items;
  const normalizedLock = normalizeText(lockedRestaurant);
  const hasRestaurantSignals = items.some((item) => Boolean(item.restaurantName));
  if (!hasRestaurantSignals) return items;
  const matched = items.filter((item) =>
    normalizeText(item.restaurantName ?? "").includes(normalizedLock),
  );
  return matched.length > 0 ? matched : items;
}

// ── Constraint resolution ─────────────────────────────────────────────

function resolveConstraints(
  renderContext?: ToolRenderContext,
): FoodorderConstraintState {
  const fromSnapshot = renderContext?.strictConstraints;
  const fromQuery = extractFoodorderConstraints(renderContext?.latestUserQuery ?? "");
  const merged: FoodorderConstraintState = {
    ...fromQuery,
    ...fromSnapshot,
    rawQuery: renderContext?.latestUserQuery ?? fromQuery.rawQuery,
    queryTerms: fromSnapshot
      ? unique([
          ...fromQuery.queryTerms,
          ...tokenizeQuery(
            [
              ...(fromSnapshot.cuisines ?? []),
              ...(fromSnapshot.dishes ?? []),
              fromSnapshot.diet ?? "",
              fromSnapshot.spicy ? "spicy" : "",
            ]
              .filter(Boolean)
              .join(" "),
          ),
        ])
      : fromQuery.queryTerms,
  };
  return merged;
}

// ── Reranking ─────────────────────────────────────────────────────────

export function rerankFoodorderRestaurants(
  items: ParsedRestaurant[],
  renderContext?: ToolRenderContext,
): RelevanceResult<ParsedRestaurant> {
  const constraints = resolveConstraints(renderContext);
  const allowBroadening = renderContext?.allowConstraintBroadening ?? shouldAllowBroadening(constraints.rawQuery);
  const strictKeys = resolveStrictKeysForRestaurants(items, constraints);
  const hasQuerySignals = constraints.queryTerms.length > 0 || strictKeys.length > 0;

  if (!hasQuerySignals) {
    return {
      items: items.slice(0, MAX_RESTAURANTS_SHOWN),
      requireBroadenPrompt: false,
      debug: buildRelevanceDebug(
        "foodorder:restaurants",
        renderContext,
        strictKeys,
        true,
        items.length,
        Math.min(MAX_RESTAURANTS_SHOWN, items.length),
      ),
    };
  }

  const strictFiltered = strictKeys.length > 0
    ? items.filter((item) => restaurantStrictMatch(item, constraints, strictKeys))
    : items;

  if (strictKeys.length > 0 && strictFiltered.length === 0 && !allowBroadening) {
    return {
      items: [],
      requireBroadenPrompt: true,
      debug: buildRelevanceDebug(
        "foodorder:restaurants",
        renderContext,
        strictKeys,
        false,
        items.length,
        0,
        "No strict matches",
      ),
    };
  }

  const candidateItems = strictFiltered.length > 0 ? strictFiltered : items;
  const ranked = rankItems(candidateItems, (item) => scoreRestaurant(item, constraints));

  return {
    items: ranked.slice(0, MAX_RESTAURANTS_SHOWN),
    requireBroadenPrompt: false,
    debug: buildRelevanceDebug(
      "foodorder:restaurants",
      renderContext,
      strictKeys,
      strictFiltered.length > 0 || strictKeys.length === 0,
      items.length,
      Math.min(MAX_RESTAURANTS_SHOWN, ranked.length),
      strictFiltered.length === 0 && allowBroadening
        ? "Relaxed ranking after explicit broadening signal"
        : undefined,
    ),
  };
}

export function rerankFoodorderMenuItems(
  items: ParsedProduct[],
  renderContext?: ToolRenderContext,
): RelevanceResult<ParsedProduct> {
  const constraints = resolveConstraints(renderContext);
  const lockScopedItems = matchLockedRestaurant(items, renderContext?.lockedRestaurant);
  const allowBroadening = renderContext?.allowConstraintBroadening ?? shouldAllowBroadening(constraints.rawQuery);
  const strictKeys = resolveStrictKeysForProducts(lockScopedItems, constraints);
  const hasQuerySignals = constraints.queryTerms.length > 0 || strictKeys.length > 0;

  if (!hasQuerySignals) {
    return {
      items: lockScopedItems.slice(0, MAX_MENU_PRODUCTS_SHOWN),
      requireBroadenPrompt: false,
      debug: buildRelevanceDebug(
        "foodorder:menu",
        renderContext,
        strictKeys,
        true,
        lockScopedItems.length,
        Math.min(MAX_MENU_PRODUCTS_SHOWN, lockScopedItems.length),
      ),
    };
  }

  const strictFiltered = strictKeys.length > 0
    ? lockScopedItems.filter((item) => productStrictMatch(item, constraints, strictKeys))
    : lockScopedItems;

  if (strictKeys.length > 0 && strictFiltered.length === 0 && !allowBroadening) {
    return {
      items: [],
      requireBroadenPrompt: true,
      debug: buildRelevanceDebug(
        "foodorder:menu",
        renderContext,
        strictKeys,
        false,
        lockScopedItems.length,
        0,
        "No strict menu matches",
      ),
    };
  }

  const candidateItems = strictFiltered.length > 0 ? strictFiltered : lockScopedItems;
  const ranked = rankItems(candidateItems, (item) => scoreProduct(item, constraints));

  return {
    items: ranked.slice(0, MAX_MENU_PRODUCTS_SHOWN),
    requireBroadenPrompt: false,
    debug: buildRelevanceDebug(
      "foodorder:menu",
      renderContext,
      strictKeys,
      strictFiltered.length > 0 || strictKeys.length === 0,
      lockScopedItems.length,
      Math.min(MAX_MENU_PRODUCTS_SHOWN, ranked.length),
      strictFiltered.length === 0 && allowBroadening
        ? "Relaxed ranking after explicit broadening signal"
        : undefined,
    ),
  };
}
