import type { ParsedToolResult, ParsedProduct } from "@/lib/types";
import { asArray, str, num } from "./primitives";

export function tryParseProducts(payload: unknown): ParsedToolResult | null {
  const arr = asArray(payload);
  if (!arr || arr.length === 0) return null;

  const items: ParsedProduct[] = [];
  for (const item of arr) {
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;
    const name = str(obj.name) || str(obj.displayName) || str(obj.product_name) || str(obj.title);
    if (!name) continue;

    const variations = allVariations(obj.variations);

    if (variations.length <= 1) {
      const variation = variations[0];
      const priceObj = variation?.price as Record<string, unknown> | undefined;

      items.push({
        id: str(obj.id) || str(obj.productId) || str(obj.product_id) || str(obj.item_id) || str(variation?.spinId) || String(items.length),
        name,
        price: num(priceObj?.offerPrice) ?? num(priceObj?.offer_price) ?? num(obj.selling_price) ?? num(obj.price) ?? num(obj.cost) ?? num(obj.offer_price),
        mrp: num(priceObj?.mrp) ?? num(obj.mrp) ?? num(obj.marked_price) ?? num(obj.original_price),
        image: str(obj.image) || str(obj.imageUrl) || str(obj.img) || str(obj.thumbnail) || str(obj.image_url),
        brand: str(obj.brand) || str(obj.brand_name) || str(variation?.brandName),
        quantity: str(variation?.quantityDescription) || str(obj.quantity) || str(obj.weight) || str(obj.size) || str(obj.pack_size),
        available: obj.isAvail != null ? Boolean(obj.isAvail) : obj.inStock != null ? Boolean(obj.inStock) : obj.available != null ? Boolean(obj.available) : obj.in_stock != null ? Boolean(obj.in_stock) : variation?.isInStockAndAvailable != null ? Boolean(variation.isInStockAndAvailable) : true,
        description: str(obj.description) || str(obj.desc),
      });
    } else {
      for (let vi = 0; vi < variations.length; vi++) {
        const variation = variations[vi];
        const priceObj = variation.price as Record<string, unknown> | undefined;
        const variantId = str(obj.id) || str(obj.productId) || str(obj.product_id) || str(obj.item_id) || str(variation.spinId) || String(items.length);

        items.push({
          id: `${variantId}-var-${vi}`,
          name,
          price: num(priceObj?.offerPrice) ?? num(priceObj?.offer_price) ?? num(obj.selling_price) ?? num(obj.price) ?? num(obj.cost) ?? num(obj.offer_price),
          mrp: num(priceObj?.mrp) ?? num(obj.mrp) ?? num(obj.marked_price) ?? num(obj.original_price),
          image: str(obj.image) || str(obj.imageUrl) || str(obj.img) || str(obj.thumbnail) || str(obj.image_url),
          brand: str(obj.brand) || str(obj.brand_name) || str(variation.brandName),
          quantity: str(variation.quantityDescription) || str(obj.quantity) || str(obj.weight) || str(obj.size) || str(obj.pack_size),
          available: obj.isAvail != null ? Boolean(obj.isAvail) : obj.inStock != null ? Boolean(obj.inStock) : obj.available != null ? Boolean(obj.available) : obj.in_stock != null ? Boolean(obj.in_stock) : variation.isInStockAndAvailable != null ? Boolean(variation.isInStockAndAvailable) : true,
          description: str(obj.description) || str(obj.desc),
        });
      }
    }
  }

  return items.length > 0 ? { type: "products", items } : null;
}

export function allVariations(variations: unknown): Record<string, unknown>[] {
  if (!Array.isArray(variations) || variations.length === 0) return [];
  return variations.filter(
    (v): v is Record<string, unknown> => typeof v === "object" && v !== null,
  );
}
