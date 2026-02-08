import { CalendarCheck } from "lucide-react";

export function BookingConfirmedCard({
  details,
  accentColor,
}: {
  details: Record<string, unknown>;
  accentColor: string;
}) {
  // Try to extract common fields
  const restaurant = String(details.restaurant_name || details.restaurant || details.name || "");
  const date = String(details.date || details.booking_date || "");
  const time = String(details.time || details.slot || details.booking_time || "");
  const guests = details.guests || details.party_size || details.pax;
  const bookingId = String(details.booking_id || details.id || details.confirmation_id || "");

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
          <CalendarCheck
            className="h-7 w-7"
            style={{ color: `var(--color-${accentColor})` }}
          />
        </div>
      </div>
      <h4 className="mb-2 text-sm font-bold text-gray-900">Booking Confirmed!</h4>
      <div className="space-y-1 text-xs text-gray-600">
        {restaurant && <p className="font-medium text-gray-900">{restaurant}</p>}
        {date && <p>{date}{time ? ` at ${time}` : ""}</p>}
        {guests != null && <p>{String(guests)} guests</p>}
        {bookingId && <p className="text-gray-400">Booking ID: {bookingId}</p>}
      </div>
    </div>
  );
}
