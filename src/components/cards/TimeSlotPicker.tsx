import { useState } from "react";
import { Clock } from "lucide-react";
import type { ParsedTimeSlot } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookingConfirmationSheet } from "./BookingConfirmationSheet";

export function TimeSlotPicker({
  slots,
  restaurantName,
  onAction,
}: {
  slots: ParsedTimeSlot[];
  restaurantName?: string;
  onAction: (message: string) => void;
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
      <Card className="rounded-2xl py-0 gap-0">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h4 className="min-w-0 truncate text-sm font-semibold text-card-foreground">
              {restaurantName ? `Available slots at ${restaurantName}` : "Available time slots"}
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <Button
                key={slot.time}
                variant="outline"
                size="sm"
                disabled={!slot.available}
                aria-label={`${slot.time}${slot.available ? "" : " (unavailable)"}`}
                aria-disabled={!slot.available}
                onClick={() => handleSlotClick(slot)}
                className={`text-xs font-medium tabular-nums min-w-[4.5rem] ${
                  slot.available
                    ? "border-primary/40 text-primary bg-primary-50/60 hover:bg-primary-50 hover:border-primary/60 active:scale-[0.98]"
                    : ""
                }`}
              >
                {slot.time}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

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
