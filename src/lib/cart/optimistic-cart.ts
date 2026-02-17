import type { CartItem, ParsedProduct } from "@/lib/types";

export interface OptimisticCartEntry extends CartItem {
  restaurantScope?: string | null;
  updatedAt: number;
}

function normalize(value: string | undefined | null): string {
  return (value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeId(value: string | undefined | null): string {
  return (value || "")
    .trim()
    .toLowerCase();
}

function resolveRestaurantScope(
  product: Pick<ParsedProduct, "restaurantName">,
  lockedRestaurant?: string | null,
): string {
  return normalize(lockedRestaurant) || normalize(product.restaurantName);
}

export function buildOptimisticCartKey(
  product: Pick<ParsedProduct, "id" | "name" | "restaurantName">,
  options: {
    verticalId: string;
    lockedRestaurant?: string | null;
  },
): string {
  const restaurantScope = resolveRestaurantScope(product, options.lockedRestaurant) || "-";
  const stableId = normalizeId(product.id) || "-";
  const name = normalize(product.name) || "-";
  return `${options.verticalId}|${restaurantScope}|${stableId}|${name}`;
}

function matchesRestaurantScope(
  item: Pick<OptimisticCartEntry, "restaurantScope">,
  lockedRestaurant?: string | null,
): boolean {
  const wanted = normalize(lockedRestaurant);
  if (!wanted) return true;
  return normalize(item.restaurantScope) === wanted;
}

export function findOptimisticCartKeyByName(
  entries: Record<string, OptimisticCartEntry>,
  targetName: string,
  lockedRestaurant?: string | null,
): string | null {
  const target = normalize(targetName);
  if (!target) return null;

  const pool = Object.entries(entries)
    .filter(([, entry]) => normalize(entry.name) === target)
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt);

  if (pool.length === 0) {
    const fuzzy = Object.entries(entries)
      .filter(([, entry]) => normalize(entry.name).includes(target))
      .sort((a, b) => b[1].updatedAt - a[1].updatedAt);
    if (fuzzy.length === 0) return null;

    const scoped = fuzzy.find(([, entry]) => matchesRestaurantScope(entry, lockedRestaurant));
    return (scoped ?? fuzzy[0])[0] ?? null;
  }

  const scoped = pool.find(([, entry]) => matchesRestaurantScope(entry, lockedRestaurant));
  return (scoped ?? pool[0])[0] ?? null;
}
