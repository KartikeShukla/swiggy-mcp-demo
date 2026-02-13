import { MapPin } from "lucide-react";
import type { ChatAction, ParsedAddress } from "@/lib/types";
import { sanitizeUntrustedPromptText } from "@/lib/prompt-safety";
import { ToolSectionCard } from "./ToolSectionCard";

export function AddressPicker({
  addresses,
  onAction,
}: {
  addresses: ParsedAddress[];
  onAction: (action: ChatAction) => void;
}) {
  return (
    <ToolSectionCard
      title="Select a delivery address"
      icon={<MapPin className="h-4 w-4 text-primary" />}
    >
      <div className="grid grid-cols-1 gap-2.5">
        {addresses.map((addr) => (
          <button
            key={addr.id}
            onClick={() =>
              onAction({
                kind: "select_address",
                address: addr,
                message: `Use my ${sanitizeUntrustedPromptText(addr.label, 60)} address: ${sanitizeUntrustedPromptText(addr.address, 180)}`,
              })
            }
            aria-label={`Select ${sanitizeUntrustedPromptText(addr.label, 60)} address: ${sanitizeUntrustedPromptText(addr.address, 180)}`}
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
    </ToolSectionCard>
  );
}
