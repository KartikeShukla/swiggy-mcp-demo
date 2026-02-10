import { useState } from "react";
import { Clock } from "lucide-react";
import type { ChatAction, ParsedTimeSlot } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { BookingConfirmationSheet } from "./BookingConfirmationSheet";
import { ToolSectionCard } from "./ToolSectionCard";

export function TimeSlotPicker({
  slots,
  restaurantName,
  onAction,
}: {
  slots: ParsedTimeSlot[];
  restaurantName?: string;
  onAction: (action: ChatAction) => void;
}) {
  const [pendingSlot, setPendingSlot] = useState<ParsedTimeSlot | null>(null);

  const handleSlotClick = (slot: ParsedTimeSlot) => {
    if (!slot.available) return;
    if (restaurantName) {
      setPendingSlot(slot);
      return;
    }
    onAction(`Select the ${slot.time} time slot`);
  };

  const confirmBooking = () => {
    if (!pendingSlot || !restaurantName) return;
    onAction(`Book a table at ${restaurantName} for ${pendingSlot.time}`);
    setPendingSlot(null);
  };

  return (
    <>
      <ToolSectionCard
        title={restaurantName ? `Available slots at ${restaurantName}` : "Available time slots"}
        icon={<Clock className="h-4 w-4 text-primary" />}
        bodyStyle={{ maxHeight: "var(--tool-section-half-h, 280px)" }}
      >
        <div className="grid grid-cols-3 gap-2">
          {slots.map((slot) => (
            <Button
              key={slot.time}
              variant="outline"
              disabled={!slot.available}
              aria-label={`${slot.time}${slot.available ? "" : " (unavailable)"}`}
              aria-disabled={!slot.available}
              onClick={() => handleSlotClick(slot)}
              className={`h-11 w-full rounded-xl px-2 text-sm font-semibold tabular-nums ${
                slot.available
                  ? "border-primary/40 text-primary bg-primary-50/60 hover:bg-primary-50 hover:border-primary/60 active:scale-[0.98]"
                  : ""
              }`}
            >
              {slot.time}
            </Button>
          ))}
        </div>
      </ToolSectionCard>

      {restaurantName && pendingSlot && (
        <BookingConfirmationSheet
          open
          restaurantName={restaurantName}
          slot={pendingSlot.time}
          onClose={() => setPendingSlot(null)}
          onConfirm={confirmBooking}
        />
      )}
    </>
  );
}
