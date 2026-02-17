import type {
  ParsedRestaurant,
  StrictConstraintSnapshot,
  ToolRenderContext,
} from "@/lib/types";
import { MAX_RESTAURANTS_SHOWN } from "@/lib/constants";
import {
  extractNumberFromText,
  normalizeText,
  textOverlapScore,
  tokenizeQuery,
} from "./text";
import { unique, rankItems, buildRelevanceDebug, type RelevanceResult } from "./shared";
import {
  detectCuisines as sharedDetectCuisines,
  detectDishesWithProxy,
  detectBudget,
  BROADEN_RE,
} from "./patterns";

export type { RelevanceResult };

// ── Dining-specific patterns ──────────────────────────────────────────

const VIBE_PATTERNS: Array<{ key: string; pattern: RegExp }> = [
  { key: "romantic", pattern: /\b(romantic|date[\s-]?night|cozy|intimate)\b/ },
  { key: "fine dining", pattern: /\b(fine[\s-]?dining|premium|luxury|upscale)\b/ },
  { key: "rooftop", pattern: /\b(rooftop|skyline|terrace)\b/ },
  { key: "family", pattern: /\b(family|kids|child[- ]?friendly)\b/ },
  { key: "casual", pattern: /\b(casual|laid[\s-]?back|chill)\b/ },
  { key: "live music", pattern: /\b(live\s+music|dj|music)\b/ },
  { key: "outdoor", pattern: /\b(outdoor|open[\s-]?air|al[\s-]?fresco)\b/ },
];

const AREA_HINT_PATTERNS: Array<{ key: string; pattern: RegExp }> = [
  { key: "koramangala", pattern: /\bkoramangala\b/ },
  { key: "indiranagar", pattern: /\bindiranagar\b/ },
  { key: "whitefield", pattern: /\bwhitefield\b/ },
  { key: "hsr", pattern: /\bhsr\b/ },
  { key: "btm", pattern: /\bbtm\b/ },
  { key: "gurugram", pattern: /\b(gurugram|gurgaon)\b/ },
  { key: "connaught place", pattern: /\b(connaught\s+place|cp)\b/ },
  { key: "jayanagar", pattern: /\bjayanagar\b/ },
  { key: "jp nagar", pattern: /\b(jp\s+nagar|j\.?p\.?\s*nagar)\b/ },
  { key: "marathahalli", pattern: /\bmarathahalli\b/ },
  { key: "electronic city", pattern: /\belectronic\s+city\b/ },
  { key: "mg road", pattern: /\b(mg\s+road|m\.?g\.?\s*road)\b/ },
];

const TIME_HINT_PATTERNS: Array<{ key: string; pattern: RegExp }> = [
  { key: "today", pattern: /\btoday\b/ },
  { key: "tonight", pattern: /\btonight\b/ },
  { key: "tomorrow", pattern: /\btomorrow\b/ },
  { key: "weekend", pattern: /\bweekend\b/ },
  { key: "monday", pattern: /\bmonday\b/ },
  { key: "tuesday", pattern: /\btuesday\b/ },
  { key: "wednesday", pattern: /\bwednesday\b/ },
  { key: "thursday", pattern: /\bthursday\b/ },
  { key: "friday", pattern: /\bfriday\b/ },
  { key: "saturday", pattern: /\bsaturday\b/ },
  { key: "sunday", pattern: /\bsunday\b/ },
  { key: "lunch", pattern: /\blunch\b/ },
  { key: "dinner", pattern: /\bdinner\b/ },
  { key: "brunch", pattern: /\bbrunch\b/ },
  { key: "specific-time", pattern: /\b\d{1,2}(?::\d{2})?\s*(am|pm)\b/ },
];

const PARTY_RE = /\bfor\s+(\d{1,2})\b|\b(\d{1,2})\s*(people|persons|guests|pax)\b/i;
const AREA_CAPTURE_RE = /\b(?:in|near|around|at)\s+([a-z][a-z\s]{2,30})\b/gi;

const AREA_BREAK_TOKENS = new Set([
  "for", "on", "at", "under", "below", "within", "with",
  "table", "people", "persons", "guests", "pax",
  "today", "tonight", "tomorrow", "weekend",
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "lunch", "dinner", "brunch", "budget",
]);

const AREA_IGNORE = new Set(["me", "my", "here", "there"]);

// ── Constraint extraction ─────────────────────────────────────────────

export interface DiningConstraintState extends StrictConstraintSnapshot {
  queryTerms: string[];
  rawQuery: string;
}

function parseAreaCandidate(candidate: string): string | null {
  const normalized = normalizeText(candidate);
  if (!normalized) return null;

  const keptTokens: string[] = [];
  for (const token of normalized.split(" ")) {
    if (!token) continue;
    if (AREA_BREAK_TOKENS.has(token)) break;
    keptTokens.push(token);
  }

  const area = keptTokens.join(" ").trim();
  if (!area || AREA_IGNORE.has(area)) return null;
  return area;
}

function detectAreas(queryText: string): string[] {
  const values: string[] = [];
  const normalized = normalizeText(queryText);

  for (const { key, pattern } of AREA_HINT_PATTERNS) {
    if (pattern.test(normalized)) values.push(key);
  }

  for (const match of queryText.toLowerCase().matchAll(AREA_CAPTURE_RE)) {
    const captured = match[1];
    if (!captured) continue;
    const parsed = parseAreaCandidate(captured);
    if (parsed) values.push(parsed);
  }

  return unique(values);
}

function detectVibes(query: string): string[] {
  const values: string[] = [];
  for (const { key, pattern } of VIBE_PATTERNS) {
    if (pattern.test(query)) values.push(key);
  }
  return unique(values);
}

function detectPartySize(queryText: string): number | undefined {
  const match = queryText.match(PARTY_RE);
  const value = match?.[1] ?? match?.[2];
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function detectTimeHints(query: string): string[] {
  const values: string[] = [];
  for (const { key, pattern } of TIME_HINT_PATTERNS) {
    if (pattern.test(query)) values.push(key);
  }
  return unique(values);
}

export function extractDiningConstraints(queryText: string): DiningConstraintState {
  const normalizedQuery = normalizeText(queryText);
  const constraints: DiningConstraintState = {
    rawQuery: queryText,
    queryTerms: tokenizeQuery(queryText),
  };

  const cuisines = sharedDetectCuisines(normalizedQuery);
  const vibes = detectVibes(normalizedQuery);
  const areas = detectAreas(queryText);
  const { dishes, cuisineProxy } = detectDishesWithProxy(normalizedQuery);

  const mergedCuisines = unique([...cuisines, ...cuisineProxy]);
  if (mergedCuisines.length > 0) constraints.cuisines = mergedCuisines;
  if (vibes.length > 0) constraints.vibes = vibes;
  if (areas.length > 0) constraints.areas = areas;
  if (dishes.length > 0) constraints.dishes = dishes;

  const budget = detectBudget(queryText);
  if (budget != null) constraints.budgetMax = budget;

  const partySize = detectPartySize(queryText);
  if (partySize != null) constraints.partySize = partySize;

  const timeHints = detectTimeHints(normalizedQuery);
  if (timeHints.length > 0) constraints.timeHints = timeHints;

  return constraints;
}

export function shouldAllowDiningBroadening(queryText: string): boolean {
  return BROADEN_RE.test(queryText);
}

// ── Strict matching & scoring ─────────────────────────────────────────

function getRestaurantText(item: ParsedRestaurant): string {
  return normalizeText(
    [
      item.name,
      item.cuisine,
      item.locality,
      item.address,
      item.priceForTwo,
      ...(item.offers ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function matchesValues(text: string, values?: string[]): boolean {
  if (!values || values.length === 0) return true;
  const normalizedValues = values.map((value) => normalizeText(value));
  return normalizedValues.some((value) => value && text.includes(value));
}

function resolveStrictKeys(
  items: ParsedRestaurant[],
  constraints: DiningConstraintState,
): string[] {
  const keys: string[] = [];

  if (constraints.cuisines?.length && items.some((item) => matchesValues(getRestaurantText(item), constraints.cuisines))) {
    keys.push("cuisine");
  }

  if (constraints.vibes?.length && items.some((item) => matchesValues(getRestaurantText(item), constraints.vibes))) {
    keys.push("vibe");
  }

  if (constraints.areas?.length && items.some((item) => matchesValues(getRestaurantText(item), constraints.areas))) {
    keys.push("area");
  }

  if (constraints.dishes?.length && items.some((item) => matchesValues(getRestaurantText(item), constraints.dishes))) {
    keys.push("dish");
  }

  if (constraints.budgetMax != null && items.some((item) => extractNumberFromText(item.priceForTwo) != null)) {
    keys.push("budget");
  }

  return keys;
}

function strictMatch(
  item: ParsedRestaurant,
  constraints: DiningConstraintState,
  strictKeys: string[],
): boolean {
  const text = getRestaurantText(item);

  for (const key of strictKeys) {
    if (key === "cuisine" && !matchesValues(text, constraints.cuisines)) return false;
    if (key === "vibe" && !matchesValues(text, constraints.vibes)) return false;
    if (key === "area" && !matchesValues(text, constraints.areas)) return false;
    if (key === "dish" && !matchesValues(text, constraints.dishes)) return false;

    if (
      key === "budget" &&
      constraints.budgetMax != null &&
      (extractNumberFromText(item.priceForTwo) ?? Number.POSITIVE_INFINITY) > constraints.budgetMax
    ) {
      return false;
    }
  }

  return true;
}

function scoreRestaurant(item: ParsedRestaurant, constraints: DiningConstraintState): number {
  const text = getRestaurantText(item);
  let score = textOverlapScore(text, constraints.queryTerms) * 2;

  if (matchesValues(text, constraints.cuisines)) score += 8;
  if (matchesValues(text, constraints.vibes)) score += 6;
  if (matchesValues(text, constraints.areas)) score += 4;
  if (matchesValues(text, constraints.dishes)) score += 4;

  if (
    constraints.budgetMax != null &&
    (extractNumberFromText(item.priceForTwo) ?? Number.POSITIVE_INFINITY) <= constraints.budgetMax
  ) {
    score += 2;
  }

  if (typeof item.rating === "number") {
    score += Math.max(0, item.rating - 3) * 1.5;
  }

  if ((item.offers?.length ?? 0) > 0) score += 0.5;

  return score;
}

// ── Constraint resolution & reranking ─────────────────────────────────

function resolveConstraints(renderContext?: ToolRenderContext): DiningConstraintState {
  const fromSnapshot = renderContext?.strictConstraints;
  const fromQuery = extractDiningConstraints(renderContext?.latestUserQuery ?? "");

  const merged: DiningConstraintState = {
    rawQuery: renderContext?.latestUserQuery ?? fromQuery.rawQuery,
    queryTerms: fromSnapshot
      ? unique([
          ...fromQuery.queryTerms,
          ...tokenizeQuery(
            [
              ...(fromSnapshot.cuisines ?? []),
              ...(fromSnapshot.vibes ?? []),
              ...(fromSnapshot.areas ?? []),
              ...(fromSnapshot.dishes ?? []),
              ...(fromSnapshot.timeHints ?? []),
            ]
              .filter(Boolean)
              .join(" "),
          ),
        ])
      : fromQuery.queryTerms,
  };

  const cuisines = unique([...(fromQuery.cuisines ?? []), ...(fromSnapshot?.cuisines ?? [])]);
  const vibes = unique([...(fromQuery.vibes ?? []), ...(fromSnapshot?.vibes ?? [])]);
  const areas = unique([...(fromQuery.areas ?? []), ...(fromSnapshot?.areas ?? [])]);
  const dishes = unique([...(fromQuery.dishes ?? []), ...(fromSnapshot?.dishes ?? [])]);
  const timeHints = unique([...(fromQuery.timeHints ?? []), ...(fromSnapshot?.timeHints ?? [])]);

  if (cuisines.length > 0) merged.cuisines = cuisines;
  if (vibes.length > 0) merged.vibes = vibes;
  if (areas.length > 0) merged.areas = areas;
  if (dishes.length > 0) merged.dishes = dishes;
  if (timeHints.length > 0) merged.timeHints = timeHints;

  merged.budgetMax = fromSnapshot?.budgetMax ?? fromQuery.budgetMax;
  merged.partySize = fromSnapshot?.partySize ?? fromQuery.partySize;

  return merged;
}

function composeNote(...notes: Array<string | undefined>): string | undefined {
  const resolved = notes.filter(Boolean);
  return resolved.length > 0 ? resolved.join(" | ") : undefined;
}

export function rerankDiningRestaurants(
  items: ParsedRestaurant[],
  renderContext?: ToolRenderContext,
): RelevanceResult<ParsedRestaurant> {
  const constraints = resolveConstraints(renderContext);
  const allowBroadening =
    renderContext?.allowConstraintBroadening ?? shouldAllowDiningBroadening(constraints.rawQuery);
  const strictKeys = resolveStrictKeys(items, constraints);
  const hasQuerySignals = constraints.queryTerms.length > 0 || strictKeys.length > 0;
  const usingCuisineProxyForDish =
    Boolean(constraints.dishes?.length) &&
    !strictKeys.includes("dish") &&
    Boolean(constraints.cuisines?.length);

  if (!hasQuerySignals) {
    return {
      items: items.slice(0, MAX_RESTAURANTS_SHOWN),
      requireBroadenPrompt: false,
      debug: buildRelevanceDebug(
        "dining:restaurants",
        renderContext,
        strictKeys,
        true,
        items.length,
        Math.min(MAX_RESTAURANTS_SHOWN, items.length),
        usingCuisineProxyForDish ? "Dish intent mapped via cuisine proxy" : undefined,
      ),
    };
  }

  const strictFiltered = strictKeys.length > 0
    ? items.filter((item) => strictMatch(item, constraints, strictKeys))
    : items;

  if (strictKeys.length > 0 && strictFiltered.length === 0 && !allowBroadening) {
    return {
      items: [],
      requireBroadenPrompt: true,
      debug: buildRelevanceDebug(
        "dining:restaurants",
        renderContext,
        strictKeys,
        false,
        items.length,
        0,
        composeNote(
          "No strict dining matches",
          usingCuisineProxyForDish ? "Dish intent mapped via cuisine proxy" : undefined,
        ),
      ),
    };
  }

  const candidateItems = strictFiltered.length > 0 ? strictFiltered : items;
  const ranked = rankItems(candidateItems, (item) => scoreRestaurant(item, constraints));

  return {
    items: ranked.slice(0, MAX_RESTAURANTS_SHOWN),
    requireBroadenPrompt: false,
    debug: buildRelevanceDebug(
      "dining:restaurants",
      renderContext,
      strictKeys,
      strictFiltered.length > 0 || strictKeys.length === 0,
      items.length,
      Math.min(MAX_RESTAURANTS_SHOWN, ranked.length),
      composeNote(
        strictFiltered.length === 0 && allowBroadening
          ? "Relaxed ranking after explicit broadening signal"
          : undefined,
        usingCuisineProxyForDish ? "Dish intent mapped via cuisine proxy" : undefined,
      ),
    ),
  };
}
