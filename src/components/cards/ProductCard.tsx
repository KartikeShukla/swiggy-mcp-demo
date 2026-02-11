import { Package, Plus, Minus } from "lucide-react";
import type { ParsedProduct } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ProductCard({
  product,
  quantity,
  onIncrement,
  onDecrement,
}: {
  product: ParsedProduct;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const unavailable = product.available === false;
  const hasDiscount = product.mrp && product.price && product.mrp > product.price;

  return (
    <Card
      className={`h-full w-full rounded-2xl py-0 gap-0 ${
        unavailable ? "opacity-50" : ""
      }`}
    >
      {/* Image */}
      <div className="flex h-24 items-center justify-center rounded-t-2xl bg-muted overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full rounded-t-2xl object-cover"
          />
        ) : (
          <Package className="h-8 w-8 text-muted-foreground/25" />
        )}
      </div>

      {/* Details */}
      <CardContent className="flex flex-1 flex-col px-3 pt-2 pb-3">
        {product.brand && (
          <span className="text-[11px] text-muted-foreground/60">
            {product.brand}
          </span>
        )}
        <h4 className="mb-0.5 line-clamp-2 text-[15px] font-semibold text-card-foreground leading-tight">
          {product.name}
        </h4>
        {product.description && (
          <p className="mb-0.5 line-clamp-1 text-[11px] text-muted-foreground/70 leading-snug">
            {product.description}
          </p>
        )}
        {product.quantity && (
          <span className="mb-1 text-xs text-muted-foreground">{product.quantity}</span>
        )}

        <div className="mt-auto flex items-center gap-1">
          {product.price != null && (
            <span className="text-sm font-bold text-card-foreground">₹{product.price}</span>
          )}
          {hasDiscount && (
            <span className="text-xs text-muted-foreground/70 line-through">₹{product.mrp}</span>
          )}
        </div>

        {unavailable ? (
          <span className="mt-2 text-center text-xs font-medium text-muted-foreground">
            Out of stock
          </span>
        ) : quantity === 0 ? (
          <Button
            onClick={onIncrement}
            aria-label={`Add ${product.name} to cart`}
            variant="outline"
            size="sm"
            className="mt-2 w-full gap-1 border-orange-500/30 text-xs font-medium text-orange-500 transition-colors hover:!border-orange-500 hover:!bg-orange-500 hover:!text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        ) : (
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <Button
              onClick={onDecrement}
              aria-label={`Decrease ${product.name} quantity`}
              size="icon-xs"
              className="h-8 w-8 rounded-full"
            >
              <Minus className="h-4 w-4 stroke-[2.6]" />
            </Button>
            <span className="w-6 text-center text-xs font-semibold text-card-foreground">
              {quantity}
            </span>
            <Button
              onClick={onIncrement}
              aria-label={`Increase ${product.name} quantity`}
              size="icon-xs"
              className="h-8 w-8 rounded-full"
            >
              <Plus className="h-4 w-4 stroke-[2.6]" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
