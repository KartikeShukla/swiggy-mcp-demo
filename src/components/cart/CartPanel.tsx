import { useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import type { CartState } from "@/lib/types";
import { OrderConfirmation } from "./OrderConfirmation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function CartPanel({
  cart,
  onClose,
  onAction,
}: {
  cart: CartState;
  onClose: () => void;
  onAction: (message: string) => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirm = () => {
    setShowConfirm(false);
    onClose();
    onAction("I confirm. Please place the order.");
  };

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Header */}
        <SheetHeader className="border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <SheetTitle className="text-sm">
              Your Cart ({cart.items.reduce((s, i) => s + i.quantity, 0)})
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Items */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted/70">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[13px] font-medium text-card-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={() => {
                      if (item.quantity <= 1) {
                        onAction(`Remove ${item.name} from my cart`);
                      } else {
                        onAction(`Change ${item.name} quantity to ${item.quantity - 1}`);
                      }
                    }}
                  >
                    {item.quantity <= 1 ? (
                      <Trash2 className="h-3 w-3 text-destructive/70" />
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                  </Button>
                  <span className="w-6 text-center text-xs font-bold tabular-nums">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={() => onAction(`Change ${item.name} quantity to ${item.quantity + 1}`)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer - Bill */}
        <div className="border-t border-border px-4 py-5">
          <div className="mb-3 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">₹{cart.subtotal}</span>
            </div>
            {cart.deliveryFee > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Delivery Fee</span>
                <span className="tabular-nums">₹{cart.deliveryFee}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between text-sm font-bold text-foreground">
              <span>Total</span>
              <span className="tabular-nums">₹{cart.total}</span>
            </div>
          </div>
          <Button
            onClick={() => setShowConfirm(true)}
            className="w-full rounded-xl text-sm font-semibold shadow-sm"
          >
            Place Order (COD)
          </Button>
        </div>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <OrderConfirmation
          cart={cart}
          onConfirm={handleConfirm}
          onClose={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
