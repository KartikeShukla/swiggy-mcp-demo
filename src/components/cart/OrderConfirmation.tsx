import { AlertTriangle } from "lucide-react";
import type { CartState } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetDescription,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function OrderConfirmation({
  cart,
  onConfirm,
  onClose,
}: {
  cart: CartState;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[82dvh] p-0">
        <SheetHeader>
          <SheetTitle className="text-base">Are you sure you want to place this COD order?</SheetTitle>
          <SheetDescription>
            Review your order summary before placing this non-cancellable order.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4">
          {/* Order summary */}
          <div className="space-y-2 rounded-xl border border-border/80 bg-card p-3">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-card-foreground">
                  {item.name} <span className="text-muted-foreground/70">x{item.quantity}</span>
                </span>
                <span className="font-medium">₹{item.price * item.quantity}</span>
              </div>
            ))}
            <Separator className="my-0.5" />
            <div className="flex justify-between text-sm font-bold text-foreground">
              <span>Total</span>
              <span>₹{cart.total}</span>
            </div>
          </div>

          {/* Warning */}
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              If you continue, that will place a <strong>non-cancellable</strong> order through your Swiggy account.
            </p>
          </div>
        </div>

        <SheetFooter className="gap-2.5">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Cancel
          </Button>
          <Button className="w-full" onClick={onConfirm}>
            Yes, place COD order
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
