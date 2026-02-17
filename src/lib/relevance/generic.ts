import type { ParsedProduct, ParsedRestaurant } from "@/lib/types";
import { textOverlapScore, tokenizeQuery } from "./text";
import { rankItems } from "./shared";

export function rerankProductsByQuery(
  items: ParsedProduct[],
  query: string,
): ParsedProduct[] {
  const terms = tokenizeQuery(query);
  if (terms.length === 0 || items.length <= 1) return items;
  return rankItems(items, (item) => {
    const text = [
      item.name,
      item.brand,
      item.itemType,
      item.description,
      item.groupLabel,
    ]
      .filter(Boolean)
      .join(" ");
    const overlap = textOverlapScore(text, terms);
    return overlap + (item.available === true ? 0.25 : 0);
  });
}

export function rerankRestaurantsByQuery(
  items: ParsedRestaurant[],
  query: string,
): ParsedRestaurant[] {
  const terms = tokenizeQuery(query);
  if (terms.length === 0 || items.length <= 1) return items;
  return rankItems(items, (item) => {
    const text = [
      item.name,
      item.cuisine,
      item.locality,
      item.address,
    ]
      .filter(Boolean)
      .join(" ");
    const overlap = textOverlapScore(text, terms);
    return overlap + (typeof item.rating === "number" ? Math.max(0, item.rating - 3) * 0.5 : 0);
  });
}
