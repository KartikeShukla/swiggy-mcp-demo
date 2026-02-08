import type { ParsedToolResult, ParsedRestaurant } from "@/lib/types";
import { asArray, str, num } from "./primitives";

export function tryParseRestaurants(payload: unknown): ParsedToolResult | null {
  const arr = asArray(payload);
  if (!arr || arr.length === 0) return null;

  const items: ParsedRestaurant[] = [];
  for (const item of arr) {
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;
    const name = str(obj.name) || str(obj.displayName) || str(obj.restaurant_name) || str(obj.title);
    if (!name) continue;

    // Must look somewhat like a restaurant
    const hasRestaurantFields = obj.cuisine || obj.cuisines || obj.rating || obj.priceForTwo ||
      obj.price_for_two || obj.locality || obj.area || obj.address;
    if (!hasRestaurantFields) continue;

    const cuisineRaw = obj.cuisine || obj.cuisines;
    const cuisine = Array.isArray(cuisineRaw) ? cuisineRaw.join(", ") : str(cuisineRaw);

    const offersRaw = obj.offers || obj.active_offers;
    const offers = Array.isArray(offersRaw)
      ? offersRaw.map((o: unknown) => (typeof o === "string" ? o : typeof o === "object" && o !== null ? str((o as Record<string, unknown>).title) || str((o as Record<string, unknown>).description) || JSON.stringify(o) : String(o)))
      : undefined;

    items.push({
      id: str(obj.id) || str(obj.restaurant_id) || String(items.length),
      name,
      cuisine: cuisine || undefined,
      rating: num(obj.rating) ?? num(obj.avg_rating),
      priceForTwo: str(obj.priceForTwo) || str(obj.price_for_two) || (num(obj.cost_for_two) ? `₹${num(obj.cost_for_two)}` : undefined),
      image: str(obj.image) || str(obj.imageUrl) || str(obj.img) || str(obj.thumbnail) || str(obj.image_url),
      address: str(obj.address) || str(obj.full_address),
      offers,
      locality: str(obj.locality) || str(obj.area) || str(obj.location),
    });
  }

  return items.length > 0 ? { type: "restaurants", items } : null;
}
