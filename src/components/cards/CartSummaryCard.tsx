import { ShoppingBag } from "lucide-react";
import type { CartState } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function CartSummaryCard({
  cart,
}: {
  cart: CartState;
}) {
  return (
    <Card className="rounded-2xl py-0 gap-0">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-card-foreground">
            Cart ({cart.items.reduce((s, i) => s + i.quantity, 0)} items)
          </h4>
        </div>

        <div className="space-y-2">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-[13px]">
              <span className="min-w-0 truncate text-card-foreground">
                {item.name} <span className="text-muted-foreground">x{item.quantity}</span>
              </span>
              <span className="font-semibold tabular-nums text-card-foreground">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        <Separator className="my-3" />

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">₹{cart.subtotal}</span>
          </div>
          {cart.deliveryFee > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Delivery</span>
              <span className="tabular-nums">₹{cart.deliveryFee}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-card-foreground">
            <span>Total</span>
            <span className="tabular-nums">₹{cart.total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
