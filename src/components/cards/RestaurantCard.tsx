import { UtensilsCrossed, Star, Tag, MapPin } from "lucide-react";
import type { ParsedRestaurant } from "@/lib/types";

export function RestaurantCard({
  restaurant,
  onAction,
  accentColor,
}: {
  restaurant: ParsedRestaurant;
  onAction: (message: string) => void;
  accentColor: string;
}) {
  return (
    <div className="flex w-64 shrink-0 flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Image */}
      <div className="flex h-36 items-center justify-center rounded-t-xl bg-gray-50">
        {restaurant.image ? (
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="h-full w-full rounded-t-xl object-cover"
          />
        ) : (
          <UtensilsCrossed className="h-10 w-10 text-gray-300" />
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col p-3">
        <h4 className="mb-1 text-sm font-semibold text-gray-900 leading-tight">
          {restaurant.name}
        </h4>

        {/* Cuisine + Rating row */}
        <div className="mb-1.5 flex items-center gap-2 text-xs text-gray-500">
          {restaurant.cuisine && (
            <span className="truncate">{restaurant.cuisine}</span>
          )}
          {restaurant.rating != null && (
            <span className="flex shrink-0 items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {restaurant.rating}
            </span>
          )}
        </div>

        {/* Price + Location */}
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
          {restaurant.priceForTwo && <span>{restaurant.priceForTwo} for two</span>}
          {restaurant.locality && (
            <span className="flex items-center gap-0.5 truncate">
              <MapPin className="h-3 w-3" />
              {restaurant.locality}
            </span>
          )}
        </div>

        {/* Offers */}
        {restaurant.offers && restaurant.offers.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {restaurant.offers.slice(0, 2).map((offer, i) => (
              <span
                key={i}
                className="flex items-center gap-0.5 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700"
              >
                <Tag className="h-2.5 w-2.5" />
                {offer}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={() => onAction(`Check availability at ${restaurant.name}`)}
          className="mt-auto rounded-lg py-1.5 text-xs font-semibold text-white transition-colors"
          style={{ backgroundColor: `var(--color-${accentColor})` }}
        >
          Check Availability
        </button>
      </div>
    </div>
  );
}
