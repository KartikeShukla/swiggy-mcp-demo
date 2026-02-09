import type { ParsedToolResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductGrid } from "./ProductGrid";
import { RestaurantCard } from "./RestaurantCard";
import { TimeSlotPicker } from "./TimeSlotPicker";
import { AddressPicker } from "./AddressPicker";
import { CartSummaryCard } from "./CartSummaryCard";
import { OrderConfirmationCard } from "./OrderConfirmationCard";
import { BookingConfirmedCard } from "./BookingConfirmedCard";
import { StatusCard } from "./StatusCard";
import { InfoCard } from "./InfoCard";

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
      const isMultiRow = result.items.length > 3;
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
            "overflow-x-auto scrollbar-thin-h snap-x snap-mandatory scroll-px-3 pb-2 -mx-3 px-3",
            isMultiRow
              ? "grid grid-rows-2 grid-flow-col auto-cols-[calc(50%_-_5px)] gap-2.5"
              : "flex items-stretch gap-2.5",
          )}>
            {result.items.map((restaurant) => (
              <div
                key={restaurant.id}
                className={cn(
                  "snap-start h-full",
                  isMultiRow ? "w-full" : "w-[calc(50%_-_5px)] shrink-0",
                )}
              >
                <RestaurantCard
                  restaurant={restaurant}
                  onAction={onAction}
                  actionLabel={actionLabel}
                  actionMessage={actionMessage}
                />
              </div>
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
