import { Package, Plus, Minus } from "lucide-react";
import type { ParsedProduct } from "@/lib/types";

export function ProductCard({
  product,
  quantity,
  onIncrement,
  onDecrement,
  accentColor,
}: {
  product: ParsedProduct;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  accentColor: string;
}) {
  const unavailable = product.available === false;
  const hasDiscount = product.mrp && product.price && product.mrp > product.price;

  return (
    <div
      className={`flex w-48 shrink-0 flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md ${
        unavailable ? "opacity-60" : ""
      }`}
    >
      {/* Image */}
      <div className="flex h-32 items-center justify-center rounded-t-xl bg-gray-50">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full rounded-t-xl object-cover"
          />
        ) : (
          <Package className="h-10 w-10 text-gray-300" />
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col p-3">
        {product.brand && (
          <span className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">
            {product.brand}
          </span>
        )}
        <h4 className="mb-1 line-clamp-2 text-sm font-semibold text-gray-900 leading-tight">
          {product.name}
        </h4>
        {product.quantity && (
          <span className="mb-1.5 text-xs text-gray-500">{product.quantity}</span>
        )}

        <div className="mt-auto flex items-center gap-1.5">
          {product.price != null && (
            <span className="text-sm font-bold text-gray-900">₹{product.price}</span>
          )}
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">₹{product.mrp}</span>
          )}
        </div>

        {unavailable ? (
          <span className="mt-2 text-center text-xs font-medium text-red-400">
            Out of stock
          </span>
        ) : quantity === 0 ? (
          <button
            onClick={onIncrement}
            className="mt-2 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold text-white transition-colors"
            style={{ backgroundColor: `var(--color-${accentColor})` }}
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        ) : (
          <div className="mt-2 flex items-center justify-center gap-0.5">
            <button
              onClick={onDecrement}
              className="flex h-7 w-7 items-center justify-center rounded-l-lg text-white transition-colors"
              style={{ backgroundColor: `var(--color-${accentColor})` }}
            >
              <Minus className="h-3 w-3" />
            </button>
            <span
              className="flex h-7 w-8 items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: `var(--color-${accentColor})` }}
            >
              {quantity}
            </span>
            <button
              onClick={onIncrement}
              className="flex h-7 w-7 items-center justify-center rounded-r-lg text-white transition-colors"
              style={{ backgroundColor: `var(--color-${accentColor})` }}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
