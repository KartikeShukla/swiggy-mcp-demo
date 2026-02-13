import { useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import type { CartState, ChatAction } from "@/lib/types";
import { OrderConfirmation } from "./OrderConfirmation";
import { Button } from "@/components/ui/button";
import { SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function CartPanel({
  cart,
  onClose,
  onAction,
}: {
  cart: CartState;
  onClose: () => void;
  onAction: (action: ChatAction) => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirm = () => {
    setShowConfirm(false);
    onClose();
    onAction("I confirm. Please place the order.");
  };

  return (
    <>
      <SheetHeader className="shrink-0 px-4 pb-2 pt-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <span aria-hidden className="h-8 w-8" />
          <SheetTitle className="text-sm text-center">
            Your Cart ({cart.items.reduce((s, i) => s + i.quantity, 0)})
          </SheetTitle>
          <SheetClose
            onClick={onClose}
            className="ring-offset-background focus-visible:ring-ring justify-self-end inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/90 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </div>
      </SheetHeader>

      {/* Items */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
        <div className="flex flex-col rounded-2xl border border-border/80 bg-card p-2.5">
          <div className="space-y-2.5">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background px-3 py-3">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-12 w-12 shrink-0 rounded-md object-cover" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted/70">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[13px] font-medium leading-tight text-card-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="rounded-full"
                    aria-label={
                      item.quantity <= 1
                        ? `Remove ${item.name} from cart`
                        : `Decrease ${item.name} quantity to ${item.quantity - 1}`
                    }
                    onClick={() => {
                      if (item.quantity <= 1) {
                        onAction(`Remove ${item.name} from my cart`);
                      } else {
                        onAction(`Change ${item.name} quantity to ${item.quantity - 1}`);
                      }
                    }}
                  >
                    {item.quantity <= 1 ? (
                      <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
                    ) : (
                      <Minus className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <span className="w-6 text-center text-xs font-bold tabular-nums">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="rounded-full"
                    aria-label={`Increase ${item.name} quantity to ${item.quantity + 1}`}
                    onClick={() => onAction(`Change ${item.name} quantity to ${item.quantity + 1}`)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer - CTA */}
      <div className="shrink-0 px-4 pb-4 pt-3">
        <Button
          onClick={() => setShowConfirm(true)}
          className="w-full rounded-xl text-sm font-semibold shadow-sm"
        >
          Place Order by COD (₹{cart.total})
        </Button>
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
