import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import type { ChatAction, ParsedProduct } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./ProductCard";
import { ToolSectionCard } from "./ToolSectionCard";

export function ProductGrid({
  items,
  onAction,
}: {
  items: ParsedProduct[];
  onAction: (action: ChatAction) => void;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleIncrement = (productId: string) => {
    setQuantities((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const handleDecrement = (productId: string) => {
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

  const selectedItems = items.filter((p) => (quantities[p.id] || 0) > 0);
  const totalCount = selectedItems.reduce(
    (sum, p) => sum + (quantities[p.id] || 0),
    0,
  );

  const handleBulkAdd = () => {
    const parts = selectedItems.map((p) => `${quantities[p.id]}x ${p.name}`);
    onAction(`Add to cart: ${parts.join(", ")}`);
    setQuantities({});
  };

  const grouped = new Map<string, ParsedProduct[]>();
  for (const item of items) {
    const key = item.brand || "";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  }
  const groupedEntries = [...grouped.entries()];

  return (
    <div>
      {groupedEntries.map(([brand, groupItems], index) => {
        const isMultiRow = groupItems.length > 3;
        const sectionTitle = brand || (groupedEntries.length === 1 ? "Products" : `Products ${index + 1}`);

        return (
          <ToolSectionCard key={brand || `products-${index}`} title={sectionTitle}>
            <div
              className={cn(
                "overflow-x-auto scrollbar-thin-h snap-x snap-mandatory pb-2",
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
                    isMultiRow ? "w-full" : "w-[calc(50%_-_5px)] shrink-0",
                  )}
                >
                  <ProductCard
                    product={product}
                    quantity={quantities[product.id] || 0}
                    onIncrement={() => handleIncrement(product.id)}
                    onDecrement={() => handleDecrement(product.id)}
                  />
                </div>
              ))}
            </div>
          </ToolSectionCard>
        );
      })}
      {totalCount > 0 && (
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
