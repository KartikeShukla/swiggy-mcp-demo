import type { ParsedToolResult } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { RestaurantCard } from "./RestaurantCard";
import { TimeSlotPicker } from "./TimeSlotPicker";
import { AddressPicker } from "./AddressPicker";
import { CartSummaryCard } from "./CartSummaryCard";
import { OrderConfirmationCard } from "./OrderConfirmationCard";
import { BookingConfirmedCard } from "./BookingConfirmedCard";

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
        <div className="my-2 flex gap-3 overflow-x-auto pb-2">
          {result.items.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAction={onAction}
              accentColor={accentColor}
            />
          ))}
        </div>
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

    case "raw":
      return null;
  }
}
