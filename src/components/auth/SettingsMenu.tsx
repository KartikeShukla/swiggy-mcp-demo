import { useState, useEffect } from "react";
import { Settings, KeyRound, Link2Off, Trash2, Sun, Moon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
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
  onDisconnectSwiggy,
  onClearChats,
  onChangeAddress,
}: {
  hasApiKey: boolean;
  hasSwiggyToken: boolean;
  hasAddress?: boolean;
  onChangeApiKey: () => void;
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>

        <div className="space-y-1 px-4 pb-4">
          <button
            onClick={() => { setDark(!dark); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-muted/50 transition-colors"
          >
            {dark ? (
              <Sun className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground" />
            )}
            {dark ? "Light mode" : "Dark mode"}
          </button>

          {(hasApiKey || hasSwiggyToken || hasAddress) && <Separator />}

          {hasApiKey && (
            <button
              onClick={() => { setOpen(false); onChangeApiKey(); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-muted/50 transition-colors"
            >
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              Change API key
            </button>
          )}

          {hasSwiggyToken && (
            <button
              onClick={() => { setOpen(false); onDisconnectSwiggy(); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-muted/50 transition-colors"
            >
              <Link2Off className="h-4 w-4 text-muted-foreground" />
              Disconnect Swiggy
            </button>
          )}

          {hasAddress && onChangeAddress && (
            <button
              onClick={() => { setOpen(false); onChangeAddress(); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-muted/50 transition-colors"
            >
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Change location
            </button>
          )}

          <Separator />

          <button
            onClick={() => { setOpen(false); onClearChats(); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-destructive hover:bg-muted/50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Clear all chats
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
