import { CheckCircle, PartyPopper } from "lucide-react";

export function OrderConfirmationCard({
  orderId,
  status,
  accentColor,
}: {
  orderId?: string;
  status?: string;
  accentColor: string;
}) {
  return (
    <div
      className="rounded-xl border-2 p-5 text-center"
      style={{
        borderColor: `var(--color-${accentColor})`,
        backgroundColor: `var(--color-${accentColor}-light)`,
      }}
    >
      <div className="mb-3 flex justify-center">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: `var(--color-${accentColor})20` }}
        >
          <CheckCircle
            className="h-7 w-7"
            style={{ color: `var(--color-${accentColor})` }}
          />
        </div>
      </div>
      <div className="mb-1 flex items-center justify-center gap-1">
        <PartyPopper className="h-4 w-4 text-amber-500" />
        <h4 className="text-sm font-bold text-gray-900">
          {status || "Order Placed!"}
        </h4>
      </div>
      {orderId && (
        <p className="text-xs text-gray-500">Order ID: {orderId}</p>
      )}
    </div>
  );
}
