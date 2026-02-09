import { CalendarCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function BookingConfirmedCard({
  details,
}: {
  details: Record<string, unknown>;
}) {
  // Try to extract common fields
  const restaurant = String(details.restaurant_name || details.restaurant || details.name || "");
  const date = String(details.date || details.booking_date || "");
  const time = String(details.time || details.slot || details.booking_time || "");
  const guests = details.guests || details.party_size || details.pax;
  const bookingId = String(details.booking_id || details.id || details.confirmation_id || "");

  return (
    <Card className="rounded-2xl border border-primary/30 bg-gradient-to-b from-primary-50/80 to-card text-center py-0 gap-0">
      <CardContent className="p-4">
        <div className="mb-3 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CalendarCheck className="h-7 w-7 text-primary" />
          </div>
        </div>
        <h4 className="mb-3 text-base font-bold text-foreground">Booking Confirmed!</h4>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          {restaurant && <p className="font-medium text-foreground">{restaurant}</p>}
          {date && <p>{date}{time ? ` at ${time}` : ""}</p>}
          {guests != null && <p>{String(guests)} guests</p>}
          {bookingId && <p className="font-mono text-[10px] text-muted-foreground/70">Booking ID: {bookingId}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
