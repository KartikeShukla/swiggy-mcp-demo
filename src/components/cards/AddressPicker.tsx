import { MapPin } from "lucide-react";
import type { ParsedAddress } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";

export function AddressPicker({
  addresses,
  onAction,
}: {
  addresses: ParsedAddress[];
  onAction: (message: string) => void;
}) {
  return (
    <Card className="rounded-2xl py-0 gap-0">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold text-card-foreground">Select a delivery address</h4>
        </div>
        <div className="grid grid-cols-1 gap-2.5">
          {addresses.map((addr) => (
            <button
              key={addr.id}
              onClick={() => onAction(`Use my ${addr.label} address: ${addr.address}`)}
              aria-label={`Select ${addr.label} address: ${addr.address}`}
              className="flex w-full items-start gap-3 rounded-xl border border-border p-3 text-left transition-all hover:border-primary/40 hover:bg-primary-50 active:scale-[0.99]"
            >
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/8">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-semibold text-card-foreground">{addr.label}</span>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{addr.address}</p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
