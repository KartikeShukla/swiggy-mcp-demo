import { UtensilsCrossed, Star, Tag, MapPin } from "lucide-react";
import type { ParsedRestaurant } from "@/lib/types";
import { MAX_OFFERS_SHOWN } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function RestaurantCard({
  restaurant,
  onAction,
  actionLabel = "Check Availability",
  actionMessage,
}: {
  restaurant: ParsedRestaurant;
  onAction: (message: string) => void;
  actionLabel?: string;
  actionMessage?: (name: string) => string;
}) {
  return (
    <Card className="h-full w-full rounded-2xl py-0 gap-0">
      {/* Image */}
      <div className="relative flex h-24 items-center justify-center rounded-t-2xl bg-muted overflow-hidden">
        {restaurant.image ? (
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="h-full w-full rounded-t-2xl object-cover"
          />
        ) : (
          <UtensilsCrossed className="h-8 w-8 text-muted-foreground/25" />
        )}
        {restaurant.rating != null && (
          <span className="absolute bottom-2 left-2 flex items-center gap-0.5 rounded-md bg-white/95 backdrop-blur-md px-2 py-0.5 text-xs font-bold shadow-sm">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {restaurant.rating}
          </span>
        )}
      </div>

      {/* Details */}
      <CardContent className="flex flex-1 flex-col p-3">
        <h4 className="mb-1 text-sm font-semibold text-card-foreground leading-snug line-clamp-2">
          {restaurant.name}
        </h4>

        {/* Cuisine row */}
        <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground/80">
          {restaurant.cuisine && (
            <span className="truncate line-clamp-1">{restaurant.cuisine}</span>
          )}
        </div>

        {/* Price + Location */}
        <div className="mb-2 flex items-center gap-2 text-[11px] text-muted-foreground/60">
          {restaurant.priceForTwo && <span>{restaurant.priceForTwo} for two</span>}
          {restaurant.locality && (
            <span className="flex items-center gap-0.5 truncate">
              <MapPin className="h-2.5 w-2.5" />
              {restaurant.locality}
            </span>
          )}
        </div>

        {/* Offers */}
        {restaurant.offers && restaurant.offers.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {restaurant.offers.slice(0, MAX_OFFERS_SHOWN).map((offer, i) => (
              <Badge key={i} variant="secondary" className="gap-0.5 text-[10px] bg-primary-50 text-primary-600 border-0">
                <Tag className="h-2.5 w-2.5 text-primary" />
                {offer}
              </Badge>
            ))}
          </div>
        )}

        <Button
          onClick={() =>
            onAction(
              actionMessage
                ? actionMessage(restaurant.name)
                : `Check availability at ${restaurant.name}`
            )
          }
          aria-label={`${actionLabel} ${restaurant.name}`}
          variant="outline"
          size="sm"
          className="mt-auto w-full text-xs font-medium border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
        >
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
