import type { ParsedToolResult, ParsedProduct } from "@/lib/types";
import { MAX_PRODUCTS_SHOWN } from "@/lib/constants";
import { asArrayOrWrap, str, num, scanForPrice } from "./primitives";

function normalizeGroupKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toTitleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function simplifyLabel(value: string): string {
  return toTitleCase(
    value
      .replace(/\([^)]*\)/g, " ")
      .replace(/\b\d+([.,]\d+)?\s?(g|kg|gm|mg|ml|l|litre|liter|oz|lb|pcs?|pack|tabs?|caps?|sachets?)\b/gi, " ")
      .replace(/\bx\s?\d+\b/gi, " ")
      .replace(/[-_/,+]+/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function inferGroupFromName(name: string, brand?: string): string {
  let normalizedName = name.trim();
  if (brand) {
    const brandPrefix = new RegExp(`^${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i");
    normalizedName = normalizedName.replace(brandPrefix, "");
  }
  const compact = simplifyLabel(normalizedName)
    .split(" ")
    .slice(0, 4)
    .join(" ")
    .trim();
  return compact || "Products";
}

function firstNonEmpty(...values: Array<unknown>): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function findSourceQuery(toolInput?: Record<string, unknown>): string | undefined {
  if (!toolInput) return undefined;
  return firstNonEmpty(
    toolInput.query,
    toolInput.q,
    toolInput.search,
    toolInput.search_text,
    toolInput.searchText,
    toolInput.term,
    toolInput.keyword,
    toolInput.requirement,
    toolInput.category,
    toolInput.item_type,
    toolInput.itemType,
  );
}

function resolveGroupingMeta(
  obj: Record<string, unknown>,
  name: string,
  brand: string | undefined,
  toolInput?: Record<string, unknown>,
): { groupLabel: string; groupKey: string; sourceQuery?: string; groupOrder?: number } {
  const explicitGroup = firstNonEmpty(
    obj.requirement,
    obj.requirement_name,
    obj.requirementName,
    obj.need,
    obj.need_name,
    obj.needName,
    obj.group,
    obj.group_name,
    obj.groupName,
    obj.item_type,
    obj.product_type,
    obj.sub_category,
    obj.subCategory,
    obj.category,
    obj.category_name,
    obj.categoryName,
    obj.product_category,
    obj.menu_category,
    obj.menuCategory,
    obj.section,
    obj.section_name,
    obj.sectionName,
    obj.sku,
    obj.sku_id,
    obj.skuId,
  );
  const sourceQuery = findSourceQuery(toolInput);
  const groupLabel = simplifyLabel(explicitGroup || sourceQuery || inferGroupFromName(name, brand));
  const groupOrder = typeof obj.group_order === "number"
    ? obj.group_order
    : typeof obj.groupOrder === "number"
      ? obj.groupOrder
      : undefined;

  return {
    groupLabel: groupLabel || "Products",
    groupKey: normalizeGroupKey(groupLabel || "Products"),
    sourceQuery,
    groupOrder,
  };
}

export function tryParseProducts(
  payload: unknown,
  context?: { toolInput?: Record<string, unknown>; maxItems?: number },
): ParsedToolResult | null {
  const arr = asArrayOrWrap(payload);
  if (!arr || arr.length === 0) return null;

  const items: ParsedProduct[] = [];
  for (const item of arr) {
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;
    const name = str(obj.name) || str(obj.displayName) || str(obj.product_name) || str(obj.title);
    if (!name) continue;

    const variations = allVariations(obj.variations);
    const baseProductId = str(obj.id) || str(obj.productId) || str(obj.product_id) || str(obj.item_id);

    if (variations.length <= 1) {
      const variation = variations[0];
      const priceObj = variation?.price as Record<string, unknown> | undefined;
      const brand = str(obj.brand) || str(obj.brand_name) || str(variation?.brandName);
      const grouping = resolveGroupingMeta(obj, name, brand, context?.toolInput);
      const backendVariantId = str(variation?.spinId) || str(variation?.spin_id) || str(variation?.id);
      const quantityLabel =
        str(variation?.quantityDescription) ||
        str(obj.quantity) ||
        str(obj.weight) ||
        str(obj.size) ||
        str(obj.pack_size);

      items.push({
        id: baseProductId || backendVariantId || String(items.length),
        name,
        price: num(priceObj?.offerPrice) ?? num(priceObj?.offer_price) ??
          num(obj.selling_price) ?? num(obj.price) ?? num(obj.cost) ?? num(obj.offer_price) ??
          num(obj.defaultPrice) ?? num(obj.default_price) ??
          num(obj.finalPrice) ?? num(obj.final_price) ??
          num(obj.basePrice) ?? num(obj.base_price) ??
          scanForPrice(obj),
        mrp: num(priceObj?.mrp) ?? num(obj.mrp) ?? num(obj.marked_price) ?? num(obj.original_price),
        image: str(obj.image) || str(obj.imageUrl) || str(obj.img) || str(obj.thumbnail) || str(obj.image_url),
        brand,
        itemType: str(obj.item_type) || str(obj.product_type) || str(obj.sub_category) || str(obj.subCategory) || str(obj.category) || str(obj.product_category),
        sku: str(obj.sku) || str(obj.sku_id) || str(obj.skuId) || str(obj.product_sku) || str(obj.productSku),
        groupKey: grouping.groupKey,
        groupLabel: grouping.groupLabel,
        sourceQuery: grouping.sourceQuery,
        groupOrder: grouping.groupOrder,
        quantity: quantityLabel,
        variantLabel: quantityLabel,
        backendProductId: baseProductId,
        backendVariantId,
        available: obj.isAvail != null ? Boolean(obj.isAvail) : obj.inStock != null ? Boolean(obj.inStock) : obj.available != null ? Boolean(obj.available) : obj.in_stock != null ? Boolean(obj.in_stock) : variation?.isInStockAndAvailable != null ? Boolean(variation.isInStockAndAvailable) : true,
        description: str(obj.description) || str(obj.desc) ||
          (obj.isVeg != null ? (obj.isVeg ? "Veg" : "Non-Veg") : undefined),
        restaurantName: str(obj.restaurant_name) || str(obj.restaurantName),
      });
    } else {
      for (let vi = 0; vi < variations.length; vi++) {
        const variation = variations[vi];
        const priceObj = variation.price as Record<string, unknown> | undefined;
        const variantId = baseProductId || str(variation.spinId) || str(variation.spin_id) || str(variation.id) || String(items.length);
        const brand = str(obj.brand) || str(obj.brand_name) || str(variation.brandName);
        const grouping = resolveGroupingMeta(obj, name, brand, context?.toolInput);
        const backendVariantId = str(variation.spinId) || str(variation.spin_id) || str(variation.id);
        const quantityLabel =
          str(variation.quantityDescription) ||
          str(obj.quantity) ||
          str(obj.weight) ||
          str(obj.size) ||
          str(obj.pack_size);

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
          brand,
          itemType: str(obj.item_type) || str(obj.product_type) || str(obj.sub_category) || str(obj.subCategory) || str(obj.category) || str(obj.product_category),
          sku: str(obj.sku) || str(obj.sku_id) || str(obj.skuId) || str(obj.product_sku) || str(obj.productSku),
          groupKey: grouping.groupKey,
          groupLabel: grouping.groupLabel,
          sourceQuery: grouping.sourceQuery,
          groupOrder: grouping.groupOrder,
          quantity: quantityLabel,
          variantLabel: quantityLabel,
          backendProductId: baseProductId,
          backendVariantId,
          available: obj.isAvail != null ? Boolean(obj.isAvail) : obj.inStock != null ? Boolean(obj.inStock) : obj.available != null ? Boolean(obj.available) : obj.in_stock != null ? Boolean(obj.in_stock) : variation.isInStockAndAvailable != null ? Boolean(variation.isInStockAndAvailable) : true,
          description: str(obj.description) || str(obj.desc) ||
            (obj.isVeg != null ? (obj.isVeg ? "Veg" : "Non-Veg") : undefined),
          restaurantName: str(obj.restaurant_name) || str(obj.restaurantName),
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

  const maxItems = context?.maxItems ?? MAX_PRODUCTS_SHOWN;
  return { type: "products", items: items.slice(0, maxItems) };
}

export function allVariations(variations: unknown): Record<string, unknown>[] {
  if (!Array.isArray(variations) || variations.length === 0) return [];
  return variations.filter(
    (v): v is Record<string, unknown> => typeof v === "object" && v !== null,
  );
}
