import { CheckCircle, PartyPopper } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function OrderConfirmationCard({
  orderId,
  status,
}: {
  orderId?: string;
  status?: string;
}) {
  return (
    <Card className="rounded-2xl border border-primary/30 bg-gradient-to-b from-primary-50/80 to-card text-center py-0 gap-0">
      <CardContent className="p-4">
        <div className="mb-3 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-7 w-7 text-primary" />
          </div>
        </div>
        <div className="mb-1 flex items-center justify-center gap-1">
          <PartyPopper className="h-5 w-5 text-amber-500" />
          <h4 className="text-base font-bold text-foreground">
            {status || "Order Placed!"}
          </h4>
        </div>
        {orderId && (
          <p className="text-[11px] text-muted-foreground/60 font-mono">Order ID: {orderId}</p>
        )}
      </CardContent>
    </Card>
  );
}
