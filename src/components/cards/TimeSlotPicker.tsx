import { Clock } from "lucide-react";
import type { ParsedTimeSlot } from "@/lib/types";

export function TimeSlotPicker({
  slots,
  restaurantName,
  onAction,
  accentColor,
}: {
  slots: ParsedTimeSlot[];
  restaurantName?: string;
  onAction: (message: string) => void;
  accentColor: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-gray-500" />
        <h4 className="text-sm font-semibold text-gray-900">
          {restaurantName ? `Available slots at ${restaurantName}` : "Available time slots"}
        </h4>
      </div>
      <div className="flex flex-wrap gap-2">
        {slots.map((slot) => (
          <button
            key={slot.time}
            disabled={!slot.available}
            aria-label={`${slot.time}${slot.available ? "" : " (unavailable)"}`}
            aria-disabled={!slot.available}
            onClick={() => {
              const target = restaurantName
                ? `Book a table at ${restaurantName} for ${slot.time}`
                : `Select the ${slot.time} time slot`;
              onAction(target);
            }}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:border-gray-100 disabled:bg-gray-50 disabled:text-gray-300"
            style={
              slot.available
                ? {
                    borderColor: `var(--color-${accentColor})`,
                    color: `var(--color-${accentColor})`,
                    backgroundColor: `var(--color-${accentColor}-light)`,
                  }
                : undefined
            }
          >
            {slot.time}
          </button>
        ))}
      </div>
    </div>
  );
}
