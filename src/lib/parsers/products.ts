import type { ParsedToolResult, ParsedProduct } from "@/lib/types";
import { asArrayOrWrap, str, num, scanForPrice } from "./primitives";

export function tryParseProducts(payload: unknown): ParsedToolResult | null {
  const arr = asArrayOrWrap(payload);
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
        price: num(priceObj?.offerPrice) ?? num(priceObj?.offer_price) ??
          num(obj.selling_price) ?? num(obj.price) ?? num(obj.cost) ?? num(obj.offer_price) ??
          num(obj.defaultPrice) ?? num(obj.default_price) ??
          num(obj.finalPrice) ?? num(obj.final_price) ??
          num(obj.basePrice) ?? num(obj.base_price) ??
          scanForPrice(obj),
        mrp: num(priceObj?.mrp) ?? num(obj.mrp) ?? num(obj.marked_price) ?? num(obj.original_price),
        image: str(obj.image) || str(obj.imageUrl) || str(obj.img) || str(obj.thumbnail) || str(obj.image_url),
        brand: str(obj.brand) || str(obj.brand_name) || str(variation?.brandName),
        quantity: str(variation?.quantityDescription) || str(obj.quantity) || str(obj.weight) || str(obj.size) || str(obj.pack_size),
        available: obj.isAvail != null ? Boolean(obj.isAvail) : obj.inStock != null ? Boolean(obj.inStock) : obj.available != null ? Boolean(obj.available) : obj.in_stock != null ? Boolean(obj.in_stock) : variation?.isInStockAndAvailable != null ? Boolean(variation.isInStockAndAvailable) : true,
        description: str(obj.description) || str(obj.desc) ||
          (obj.isVeg != null ? (obj.isVeg ? "Veg" : "Non-Veg") : undefined),
      });
    } else {
      for (let vi = 0; vi < variations.length; vi++) {
        const variation = variations[vi];
        const priceObj = variation.price as Record<string, unknown> | undefined;
        const variantId = str(obj.id) || str(obj.productId) || str(obj.product_id) || str(obj.item_id) || str(variation.spinId) || String(items.length);

        items.push({
          id: `${variantId}-var-${vi}`,
          name,
          price: num(priceObj?.offerPrice) ?? num(priceObj?.offer_price) ??
            num(obj.selling_price) ?? num(obj.price) ?? num(obj.cost) ?? num(obj.offer_price) ??
            num(obj.defaultPrice) ?? num(obj.default_price) ??
            num(obj.finalPrice) ?? num(obj.final_price) ??
            num(obj.basePrice) ?? num(obj.base_price) ??
            scanForPrice(obj),
          mrp: num(priceObj?.mrp) ?? num(obj.mrp) ?? num(obj.marked_price) ?? num(obj.original_price),
          image: str(obj.image) || str(obj.imageUrl) || str(obj.img) || str(obj.thumbnail) || str(obj.image_url),
          brand: str(obj.brand) || str(obj.brand_name) || str(variation.brandName),
          quantity: str(variation.quantityDescription) || str(obj.quantity) || str(obj.weight) || str(obj.size) || str(obj.pack_size),
          available: obj.isAvail != null ? Boolean(obj.isAvail) : obj.inStock != null ? Boolean(obj.inStock) : obj.available != null ? Boolean(obj.available) : obj.in_stock != null ? Boolean(obj.in_stock) : variation.isInStockAndAvailable != null ? Boolean(variation.isInStockAndAvailable) : true,
          description: str(obj.description) || str(obj.desc) ||
            (obj.isVeg != null ? (obj.isVeg ? "Veg" : "Non-Veg") : undefined),
        });
      }
    }
  }

  if (items.length === 0) return null;

  // Detect paise pricing: if all prices > 1000 and none have fractional parts, divide by 100
  const allPricesLargeIntegers = items.every(
    (i) => i.price != null && i.price > 1000 && Number.isInteger(i.price),
  );
  if (allPricesLargeIntegers) {
    for (const item of items) {
      if (item.price != null) item.price = item.price / 100;
      if (item.mrp != null) item.mrp = item.mrp / 100;
    }
  }

  return { type: "products", items };
}

export function allVariations(variations: unknown): Record<string, unknown>[] {
  if (!Array.isArray(variations) || variations.length === 0) return [];
  return variations.filter(
    (v): v is Record<string, unknown> => typeof v === "object" && v !== null,
  );
}
