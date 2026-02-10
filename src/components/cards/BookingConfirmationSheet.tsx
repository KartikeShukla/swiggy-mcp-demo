import { X } from "lucide-react";
import {
  Sheet,
  SheetClose,
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
        overlayClassName="backdrop-blur-[3px]"
        onCloseAutoFocus={(event) => event.preventDefault()}
        className="min-h-0 h-auto max-h-[88dvh] p-0"
      >
        <SheetHeader className="px-4 pb-3 pt-5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center">
            <span aria-hidden className="h-8 w-8" />
            <SheetTitle className="text-base text-center">Are you sure you want to book this slot?</SheetTitle>
            <SheetClose className="ring-offset-background focus-visible:ring-ring justify-self-end inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/90 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none">
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </SheetClose>
          </div>
          <SheetDescription className="pt-1 text-center">
            Confirm your table booking details before we proceed.
          </SheetDescription>
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
