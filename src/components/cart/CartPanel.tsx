import { useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import type { CartState } from "@/lib/types";
import { OrderConfirmation } from "./OrderConfirmation";

export function CartPanel({
  cart,
  onClose,
  onAction,
  accentColor,
}: {
  cart: CartState;
  onClose: () => void;
  onAction: (message: string) => void;
  accentColor: string;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirm = () => {
    setShowConfirm(false);
    onClose();
    onAction("I confirm. Please place the order.");
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-40 flex h-full w-80 flex-col bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="Shopping cart">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingBag
              className="h-5 w-5"
              style={{ color: `var(--color-${accentColor})` }}
            />
            <h3 className="text-sm font-bold text-gray-900">
              Your Cart ({cart.items.reduce((s, i) => s + i.quantity, 0)})
            </h3>
          </div>
          <button onClick={onClose} aria-label="Close cart" className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
              {item.image ? (
                <img src={item.image} alt={item.name} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <ShoppingBag className="h-5 w-5 text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">₹{item.price} each</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  onClick={() => {
                    if (item.quantity <= 1) {
                      onAction(`Remove ${item.name} from my cart`);
                    } else {
                      onAction(`Change ${item.name} quantity to ${item.quantity - 1}`);
                    }
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50"
                >
                  {item.quantity <= 1 ? (
                    <Trash2 className="h-3 w-3 text-red-400" />
                  ) : (
                    <Minus className="h-3 w-3 text-gray-500" />
                  )}
                </button>
                <span className="w-5 text-center text-xs font-semibold">{item.quantity}</span>
                <button
                  onClick={() => onAction(`Change ${item.name} quantity to ${item.quantity + 1}`)}
                  className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50"
                >
                  <Plus className="h-3 w-3 text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer - Bill */}
        <div className="border-t border-gray-100 p-4">
          <div className="mb-3 space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span>
              <span>₹{cart.subtotal}</span>
            </div>
            {cart.deliveryFee > 0 && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Delivery Fee</span>
                <span>₹{cart.deliveryFee}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-gray-900">
              <span>Total</span>
              <span>₹{cart.total}</span>
            </div>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: `var(--color-${accentColor})` }}
          >
            Place Order (COD)
          </button>
        </div>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <OrderConfirmation
          cart={cart}
          onConfirm={handleConfirm}
          onClose={() => setShowConfirm(false)}
          accentColor={accentColor}
        />
      )}
    </>
  );
}
