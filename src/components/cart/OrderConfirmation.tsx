import { AlertTriangle, X } from "lucide-react";
import type { CartState } from "@/lib/types";

export function OrderConfirmation({
  cart,
  onConfirm,
  onClose,
  accentColor,
}: {
  cart: CartState;
  onConfirm: () => void;
  onClose: () => void;
  accentColor: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-labelledby="order-confirm-title">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 id="order-confirm-title" className="text-base font-bold text-gray-900">Confirm Order</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Order summary */}
        <div className="mb-3 space-y-1.5">
          {cart.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {item.name} <span className="text-gray-400">x{item.quantity}</span>
              </span>
              <span className="font-medium">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        <div className="mb-4 border-t border-gray-100 pt-2">
          <div className="flex justify-between text-sm font-bold text-gray-900">
            <span>Total</span>
            <span>₹{cart.total}</span>
          </div>
        </div>

        {/* Warning */}
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-xs text-amber-700 leading-relaxed">
            This is a COD order and <strong>CANNOT be cancelled</strong> once placed.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: `var(--color-${accentColor})` }}
          >
            Confirm Order
          </button>
        </div>
      </div>
    </div>
  );
}
