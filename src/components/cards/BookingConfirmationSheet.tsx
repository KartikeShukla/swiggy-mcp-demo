import { CalendarCheck2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function BookingConfirmationSheet({
  open,
  restaurantName,
  slot,
  onClose,
  onConfirm,
}: {
  open: boolean;
  restaurantName: string;
  slot: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="max-h-[78dvh] p-0"
      >
        <SheetHeader>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CalendarCheck2 className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <SheetTitle className="text-base">Are you sure you want to book this slot?</SheetTitle>
              <SheetDescription>
                Confirm your table booking details before we proceed.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-2 px-4 pb-1 text-sm">
          <div className="rounded-xl border border-border/80 bg-card px-3 py-2.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">Restaurant</p>
            <p className="mt-0.5 font-medium text-card-foreground">{restaurantName}</p>
          </div>
          <div className="rounded-xl border border-border/80 bg-card px-3 py-2.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70">Time slot</p>
            <p className="mt-0.5 font-medium text-card-foreground">{slot}</p>
          </div>
        </div>

        <SheetFooter className="gap-2.5">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Cancel
          </Button>
          <Button className="w-full" onClick={onConfirm}>
            Yes, book this slot
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
