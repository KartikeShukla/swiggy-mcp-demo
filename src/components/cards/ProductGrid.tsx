import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import type { ChatAction, ParsedProduct } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./ProductCard";
import { ToolSectionCard } from "./ToolSectionCard";

export interface SharedProductSelection {
  quantities: Record<string, number>;
  onIncrement: (product: ParsedProduct) => void;
  onDecrement: (productId: string) => void;
}

function toTitleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function inferItemType(product: ParsedProduct): string {
  const explicitType = product.itemType?.trim();
  if (explicitType) return explicitType;

  const sku = product.sku?.trim();
  if (sku) return sku;

  let normalizedName = product.name.trim();
  const brand = product.brand?.trim();
  if (brand) {
    const brandPrefix = new RegExp(`^${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i");
    normalizedName = normalizedName.replace(brandPrefix, "");
  }

  normalizedName = normalizedName
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b\d+([.,]\d+)?\s?(g|kg|gm|mg|ml|l|litre|liter|oz|lb|pcs?|pack|tabs?|caps?|sachets?)\b/gi, " ")
    .replace(/\bx\s?\d+\b/gi, " ")
    .replace(/[-_/,+]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = normalizedName.split(" ").filter(Boolean);
  const compact = words.slice(0, 4).join(" ").trim();
  return compact ? toTitleCase(compact) : "Products";
}

export function ProductGrid({
  items,
  onAction,
  verticalId,
  sharedSelection,
}: {
  items: ParsedProduct[];
  onAction: (action: ChatAction) => void;
  verticalId?: string;
  sharedSelection?: SharedProductSelection;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getQuantity = (productId: string) => {
    if (sharedSelection) return sharedSelection.quantities[productId] || 0;
    return quantities[productId] || 0;
  };

  const handleIncrement = (productId: string) => {
    if (sharedSelection) {
      const product = items.find((item) => item.id === productId);
      if (product) sharedSelection.onIncrement(product);
      return;
    }
    setQuantities((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const handleDecrement = (productId: string) => {
    if (sharedSelection) {
      sharedSelection.onDecrement(productId);
      return;
    }
    setQuantities((prev) => {
      const next = (prev[productId] || 0) - 1;
      if (next <= 0) {
        const rest = { ...prev };
        delete rest[productId];
        return rest;
      }
      return { ...prev, [productId]: next };
    });
  };

  const selectedItems = items.filter((p) => getQuantity(p.id) > 0);
  const totalCount = selectedItems.reduce(
    (sum, p) => sum + getQuantity(p.id),
    0,
  );

  const handleBulkAdd = () => {
    const parts = selectedItems.map((p) => `${getQuantity(p.id)}x ${p.name}`);
    onAction(`Add to cart: ${parts.join(", ")}`);
    setQuantities({});
  };

  const useTypeGrouping = verticalId === "food" || verticalId === "style";
  const grouped = new Map<string, { title: string; items: ParsedProduct[] }>();
  for (const item of items) {
    const metadataTitle = item.groupLabel?.trim();
    const inferredTitle = useTypeGrouping ? inferItemType(item) : ((item.brand || "").trim() || "Products");
    const title = metadataTitle || inferredTitle;
    const key = (item.groupKey?.trim().toLowerCase() || title.toLowerCase());
    if (!grouped.has(key)) grouped.set(key, { title, items: [] });
    grouped.get(key)!.items.push(item);
  }
  const groupedEntries = [...grouped.values()];
  const isRailSection =
    verticalId === "foodorder" || verticalId === "food" || verticalId === "style";
  const isOrangeRailSection = isRailSection;

  return (
    <div>
      {groupedEntries.map((group, index) => {
        const groupItems = group.items;
        const isMultiRow = !isRailSection && groupItems.length > 3;
        const sectionTitle = group.title || (groupedEntries.length === 1 ? "Products" : `Products ${index + 1}`);

        return (
          <ToolSectionCard
            key={`${group.title}-${index}`}
            title={sectionTitle}
            className={cn(isOrangeRailSection && "border-orange-500/20 bg-orange-500/6")}
            contentClassName={cn(isOrangeRailSection && "px-4 pt-3 pb-2.5")}
            titleClassName={cn(isOrangeRailSection && "text-[11px] font-medium text-muted-foreground/70")}
          >
            <div
              className={cn(
                "overflow-x-auto scrollbar-thin-h snap-x snap-mandatory",
                isRailSection ? "pb-1" : "pb-2",
                isMultiRow
                  ? "grid grid-rows-2 grid-flow-col auto-cols-[calc(50%_-_5px)] gap-2.5"
                  : "flex items-stretch gap-2.5",
              )}
            >
              {groupItems.map((product) => (
                <div
                  key={product.id}
                  className={cn(
                    "snap-start h-full",
                    isMultiRow
                      ? "w-full"
                      : cn(
                        "shrink-0",
                        isRailSection ? "w-[calc(66.666%_-_6.667px)]" : "w-[calc(50%_-_5px)]",
                      ),
                  )}
                >
                  <ProductCard
                    product={product}
                    quantity={getQuantity(product.id)}
                    onIncrement={() => handleIncrement(product.id)}
                    onDecrement={() => handleDecrement(product.id)}
                  />
                </div>
              ))}
            </div>
          </ToolSectionCard>
        );
      })}
      {totalCount > 0 && !sharedSelection && (
        <Button
          onClick={handleBulkAdd}
          className="mt-3 w-full gap-2 rounded-xl text-sm font-semibold shadow-sm"
        >
          <ShoppingCart className="h-4 w-4" />
          Add {totalCount} {totalCount === 1 ? "item" : "items"} to cart
        </Button>
      )}
    </div>
  );
}
