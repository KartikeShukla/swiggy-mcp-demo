import { useState } from "react";
import { Clock } from "lucide-react";
import type { ChatAction, ParsedTimeSlot } from "@/lib/types";
import { sanitizeUntrustedPromptText } from "@/lib/prompt-safety";
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
  const safeRestaurantName = restaurantName
    ? sanitizeUntrustedPromptText(restaurantName, 80)
    : undefined;

  const handleSlotClick = (slot: ParsedTimeSlot) => {
    if (!slot.available) return;
    if (safeRestaurantName) {
      setPendingSlot(slot);
      return;
    }
    const safeSlotTime = sanitizeUntrustedPromptText(slot.time, 40);
    onAction({
      kind: "slot_select",
      message: `Select the ${safeSlotTime} time slot`,
      slotTime: safeSlotTime,
      slotId: slot.slotId,
      slotToken: slot.slotToken,
      restaurantId: slot.restaurantId,
    });
  };

  const confirmBooking = () => {
    if (!pendingSlot || !safeRestaurantName) return;
    const safeSlotTime = sanitizeUntrustedPromptText(pendingSlot.time, 40);
    onAction({
      kind: "slot_select",
      message: `Book a table at ${safeRestaurantName} for ${safeSlotTime}`,
      slotTime: safeSlotTime,
      slotId: pendingSlot.slotId,
      slotToken: pendingSlot.slotToken,
      restaurantName: safeRestaurantName,
      restaurantId: pendingSlot.restaurantId,
    });
    setPendingSlot(null);
  };

  return (
    <>
      <ToolSectionCard
        title={safeRestaurantName ? `Available slots at ${safeRestaurantName}` : "Available time slots"}
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

      {safeRestaurantName && pendingSlot && (
        <BookingConfirmationSheet
          open
          restaurantName={safeRestaurantName}
          slot={pendingSlot.time}
          onClose={() => setPendingSlot(null)}
          onConfirm={confirmBooking}
        />
      )}
    </>
  );
}
