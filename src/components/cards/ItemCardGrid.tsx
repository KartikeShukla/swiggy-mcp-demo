import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import type { ParsedToolResult, ParsedProduct } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "./ProductCard";
import { RestaurantCard } from "./RestaurantCard";
import { TimeSlotPicker } from "./TimeSlotPicker";
import { AddressPicker } from "./AddressPicker";
import { CartSummaryCard } from "./CartSummaryCard";
import { OrderConfirmationCard } from "./OrderConfirmationCard";
import { BookingConfirmedCard } from "./BookingConfirmedCard";
import { StatusCard } from "./StatusCard";
import { InfoCard } from "./InfoCard";

export function ProductGrid({
  items,
  onAction,
}: {
  items: ParsedProduct[];
  onAction: (message: string) => void;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleIncrement = (productId: string) => {
    setQuantities((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const handleDecrement = (productId: string) => {
    setQuantities((prev) => {
      const next = (prev[productId] || 0) - 1;
      if (next <= 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: next };
    });
  };

  const selectedItems = items.filter((p) => (quantities[p.id] || 0) > 0);
  const totalCount = selectedItems.reduce((sum, p) => sum + (quantities[p.id] || 0), 0);

  const handleBulkAdd = () => {
    const parts = selectedItems.map(
      (p) => `${quantities[p.id]}x ${p.name}`
    );
    onAction(`Add the following items to my cart: ${parts.join(", ")}`);
    setQuantities({});
  };

  // Group items by brand
  const grouped = new Map<string, ParsedProduct[]>();
  for (const item of items) {
    const key = item.brand || "";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  }

  return (
    <div>
      {[...grouped.entries()].map(([brand, groupItems]) => (
        <div key={brand}>
          {brand && (
            <div className="mb-2 mt-3 flex items-center gap-2.5">
              <h5 className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {brand}
              </h5>
              <Separator className="flex-1" />
            </div>
          )}
          <div className={cn(
            "my-2 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2 -mx-1 px-1",
            groupItems.length > 3
              ? "grid grid-rows-2 grid-flow-col auto-cols-[144px] gap-2.5"
              : "flex gap-2.5",
          )}>
            {groupItems.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={quantities[product.id] || 0}
                onIncrement={() => handleIncrement(product.id)}
                onDecrement={() => handleDecrement(product.id)}
              />
            ))}
          </div>
        </div>
      ))}
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

export function ItemCardGrid({
  result,
  onAction,
  verticalId,
}: {
  result: ParsedToolResult;
  onAction: (message: string) => void;
  verticalId?: string;
}) {
  switch (result.type) {
    case "products":
      return (
        <ProductGrid
          items={result.items}
          onAction={onAction}
        />
      );

    case "restaurants": {
      const isFoodOrder = verticalId === "foodorder";
      const actionLabel = isFoodOrder ? "View Menu" : "Check Availability";
      const actionMessage = isFoodOrder
        ? (name: string) => `Show me the menu at ${name}`
        : undefined;
      return (
        <div className="my-2">
          <p className="mb-2 text-[11px] font-medium text-muted-foreground/70">
            {result.items.length} {result.items.length === 1 ? "restaurant" : "restaurants"} found
          </p>
          <div className={cn(
            "overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2 -mx-1 px-1",
            result.items.length > 3
              ? "grid grid-rows-2 grid-flow-col auto-cols-[160px] gap-2.5"
              : "flex gap-2.5",
          )}>
            {result.items.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onAction={onAction}
                actionLabel={actionLabel}
                actionMessage={actionMessage}
              />
            ))}
          </div>
        </div>
      );
    }

    case "time_slots":
      return (
        <div className="my-2">
          <TimeSlotPicker
            slots={result.slots}
            restaurantName={result.restaurantName}
            onAction={onAction}
          />
        </div>
      );

    case "addresses":
      return (
        <div className="my-2">
          <AddressPicker
            addresses={result.addresses}
            onAction={onAction}
          />
        </div>
      );

    case "cart":
      return (
        <div className="my-2">
          <CartSummaryCard cart={result.cart} />
        </div>
      );

    case "order_placed":
      return (
        <div className="my-2">
          <OrderConfirmationCard
            orderId={result.orderId}
            status={result.status}
          />
        </div>
      );

    case "booking_confirmed":
      return (
        <div className="my-2">
          <BookingConfirmedCard
            details={result.details}
          />
        </div>
      );

    case "status":
      return (
        <div className="my-2">
          <StatusCard status={result.status} />
        </div>
      );

    case "info":
      return (
        <div className="my-2">
          <InfoCard
            title={result.title}
            entries={result.entries}
          />
        </div>
      );

    case "raw":
      return null;
  }
}
