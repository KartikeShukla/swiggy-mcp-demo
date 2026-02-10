import type { ChatAction, ParsedToolResult } from "@/lib/types";
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
import { ToolSectionCard } from "./ToolSectionCard";

export function ItemCardGrid({
  result,
  onAction,
  verticalId,
}: {
  result: ParsedToolResult;
  onAction: (action: ChatAction) => void;
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
        ? (name: string) => `Open menu for restaurant: ${name}`
        : undefined;
      return (
        <ToolSectionCard
          title={`${result.items.length} ${result.items.length === 1 ? "restaurant" : "restaurants"} found`}
          titleClassName="text-[11px] font-medium text-muted-foreground/70"
        >
          <div className={cn(
            "overflow-x-auto scrollbar-thin-h snap-x snap-mandatory pb-2",
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
        </ToolSectionCard>
      );
    }

    case "time_slots":
      return (
        <TimeSlotPicker
          slots={result.slots}
          restaurantName={result.restaurantName}
          onAction={onAction}
        />
      );

    case "addresses":
      return (
        <AddressPicker
          addresses={result.addresses}
          onAction={onAction}
        />
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
