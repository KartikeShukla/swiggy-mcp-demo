import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import type { ParsedToolResult, ParsedProduct } from "@/lib/types";
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
  accentColor,
}: {
  items: ParsedProduct[];
  onAction: (message: string) => void;
  accentColor: string;
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

  return (
    <div>
      <div className="my-2 flex gap-3 overflow-x-auto pb-2">
        {items.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            quantity={quantities[product.id] || 0}
            onIncrement={() => handleIncrement(product.id)}
            onDecrement={() => handleDecrement(product.id)}
            accentColor={accentColor}
          />
        ))}
      </div>
      {totalCount > 0 && (
        <button
          onClick={handleBulkAdd}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: `var(--color-${accentColor})` }}
        >
          <ShoppingCart className="h-4 w-4" />
          Add {totalCount} {totalCount === 1 ? "item" : "items"} to cart
        </button>
      )}
    </div>
  );
}

export function ItemCardGrid({
  result,
  onAction,
  accentColor,
}: {
  result: ParsedToolResult;
  onAction: (message: string) => void;
  accentColor: string;
}) {
  switch (result.type) {
    case "products":
      return (
        <ProductGrid
          items={result.items}
          onAction={onAction}
          accentColor={accentColor}
        />
      );

    case "restaurants":
      return (
        <div className="my-2 flex gap-3 overflow-x-auto pb-2">
          {result.items.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onAction={onAction}
              accentColor={accentColor}
            />
          ))}
        </div>
      );

    case "time_slots":
      return (
        <div className="my-2">
          <TimeSlotPicker
            slots={result.slots}
            restaurantName={result.restaurantName}
            onAction={onAction}
            accentColor={accentColor}
          />
        </div>
      );

    case "addresses":
      return (
        <div className="my-2">
          <AddressPicker
            addresses={result.addresses}
            onAction={onAction}
            accentColor={accentColor}
          />
        </div>
      );

    case "cart":
      return (
        <div className="my-2">
          <CartSummaryCard cart={result.cart} accentColor={accentColor} />
        </div>
      );

    case "order_placed":
      return (
        <div className="my-2">
          <OrderConfirmationCard
            orderId={result.orderId}
            status={result.status}
            accentColor={accentColor}
          />
        </div>
      );

    case "booking_confirmed":
      return (
        <div className="my-2">
          <BookingConfirmedCard
            details={result.details}
            accentColor={accentColor}
          />
        </div>
      );

    case "status":
      return (
        <div className="my-2">
          <StatusCard status={result.status} accentColor={accentColor} />
        </div>
      );

    case "info":
      return (
        <div className="my-2">
          <InfoCard
            title={result.title}
            entries={result.entries}
            accentColor={accentColor}
          />
        </div>
      );

    case "raw":
      return null;
  }
}
