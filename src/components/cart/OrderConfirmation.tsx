import { AlertTriangle } from "lucide-react";
import type { CartState } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
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
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Confirm Order</SheetTitle>
        </SheetHeader>

        <div className="px-4">
          {/* Order summary */}
          <div className="space-y-1.5">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-card-foreground">
                  {item.name} <span className="text-muted-foreground/70">x{item.quantity}</span>
                </span>
                <span className="font-medium">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <Separator className="my-3" />

          <div className="flex justify-between text-sm font-bold text-foreground">
            <span>Total</span>
            <span>₹{cart.total}</span>
          </div>

          {/* Warning */}
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              If you continue, that will place a <strong>non-cancellable</strong> order through your Swiggy account.
            </p>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Cancel
          </Button>
          <Button className="w-full" onClick={onConfirm}>
            Continue
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
