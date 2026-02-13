import { useState, useEffect } from "react";
import { MoreVertical, KeyRound, Link2, Link2Off, Trash2, Sun, Moon, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function SettingsMenu({
  hasApiKey,
  hasSwiggyToken,
  hasAddress,
  onChangeApiKey,
  onConnectSwiggy,
  onDisconnectSwiggy,
  onClearChats,
  onChangeAddress,
}: {
  hasApiKey: boolean;
  hasSwiggyToken: boolean;
  hasAddress?: boolean;
  onChangeApiKey: () => void;
  onConnectSwiggy: () => void;
  onDisconnectSwiggy: () => void;
  onClearChats: () => void;
  onChangeAddress?: () => void;
}) {
  const [dark, setDark] = useState(
    () => document.documentElement.classList.contains("dark"),
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const rowClass =
    "flex w-full items-center gap-3 rounded-xl px-3.5 py-3.5 text-sm transition-colors hover:bg-muted/60";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        overlayClassName="backdrop-blur-[3px]"
        onCloseAutoFocus={(event) => event.preventDefault()}
        className="min-h-0 p-0"
      >
        <SheetHeader className="px-4 pb-4 pt-8 pr-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center">
            <span aria-hidden className="h-8 w-8" />
            <SheetTitle className="text-base text-center">Settings</SheetTitle>
            <SheetClose className="ring-offset-background focus-visible:ring-ring justify-self-end inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/90 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none">
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="max-h-[min(68dvh,32rem)] overflow-y-auto px-4 pb-12">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-card p-1">
              <button
                onClick={() => { setDark(!dark); }}
                className={rowClass}
              >
                {dark ? (
                  <Sun className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Moon className="h-4 w-4 text-muted-foreground" />
                )}
                {dark ? "Light mode" : "Dark mode"}
              </button>
            </div>

            {(hasApiKey || hasAddress) && (
              <div className="rounded-2xl border border-border/80 bg-card p-1">
                {hasApiKey && (
                  <button
                    onClick={() => { setOpen(false); onChangeApiKey(); }}
                    className={rowClass}
                  >
                    <KeyRound className="h-4 w-4 text-muted-foreground" />
                    Change API key
                  </button>
                )}
                {hasApiKey && (
                  <Separator className="my-1.5" />
                )}

                {hasApiKey && (
                  <button
                    onClick={() => {
                      setOpen(false);
                      if (hasSwiggyToken) {
                        onDisconnectSwiggy();
                      } else {
                        onConnectSwiggy();
                      }
                    }}
                    className={rowClass}
                  >
                    {hasSwiggyToken ? (
                      <Link2Off className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                    )}
                    {hasSwiggyToken ? "Disconnect Swiggy" : "Connect Swiggy"}
                  </button>
                )}
                {hasAddress && onChangeAddress && (
                  <Separator className="my-1.5" />
                )}

                {hasAddress && onChangeAddress && (
                  <button
                    onClick={() => { setOpen(false); onChangeAddress(); }}
                    className={rowClass}
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Change location
                  </button>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-1">
              <button
                onClick={() => { setOpen(false); onClearChats(); }}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Clear all chats
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
