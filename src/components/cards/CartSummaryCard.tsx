import { ShoppingBag } from "lucide-react";
import type { CartState } from "@/lib/types";

export function CartSummaryCard({
  cart,
  accentColor,
}: {
  cart: CartState;
  accentColor: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <ShoppingBag
          className="h-4 w-4"
          style={{ color: `var(--color-${accentColor})` }}
        />
        <h4 className="text-sm font-semibold text-gray-900">
          Cart ({cart.items.reduce((s, i) => s + i.quantity, 0)} items)
        </h4>
      </div>

      <div className="space-y-1.5">
        {cart.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-xs">
            <span className="text-gray-700">
              {item.name} <span className="text-gray-400">x{item.quantity}</span>
            </span>
            <span className="font-medium text-gray-900">₹{item.price * item.quantity}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-gray-100 pt-2 space-y-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Subtotal</span>
          <span>₹{cart.subtotal}</span>
        </div>
        {cart.deliveryFee > 0 && (
          <div className="flex justify-between text-xs text-gray-500">
            <span>Delivery</span>
            <span>₹{cart.deliveryFee}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-semibold text-gray-900">
          <span>Total</span>
          <span>₹{cart.total}</span>
        </div>
      </div>
    </div>
  );
}
