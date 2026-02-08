import { MapPin } from "lucide-react";
import type { ParsedAddress } from "@/lib/types";

export function AddressPicker({
  addresses,
  onAction,
  accentColor,
}: {
  addresses: ParsedAddress[];
  onAction: (message: string) => void;
  accentColor: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-gray-500" />
        <h4 className="text-sm font-semibold text-gray-900">Select a delivery address</h4>
      </div>
      <div className="space-y-2">
        {addresses.map((addr) => (
          <button
            key={addr.id}
            onClick={() => onAction(`Use my ${addr.label} address: ${addr.address}`)}
            className="flex w-full items-start gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `var(--color-${accentColor})15` }}
            >
              <MapPin
                className="h-4 w-4"
                style={{ color: `var(--color-${accentColor})` }}
              />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900">{addr.label}</span>
              <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{addr.address}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
