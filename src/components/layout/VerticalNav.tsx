import { useCallback, useMemo, useState, type MouseEvent } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bike, Salad, Sparkles, UtensilsCrossed, X } from "lucide-react";
import type { ParsedAddress } from "@/lib/types";
import { verticalList, verticals } from "@/verticals";
import { cn } from "@/lib/utils";
import { clearChatHistory } from "@/lib/storage";
import {
  hasClearableInstamartState,
  isInstamartCrossTabSwitch,
} from "@/lib/cart/tab-switch-state";
import { triggerBestEffortInstamartCartClear } from "@/lib/cart/remote-clear";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const iconMap = {
  Salad,
  Sparkles,
  UtensilsCrossed,
  Bike,
} as const;

const activeClasses = {
  food: "bg-food/20 text-green-700 dark:text-green-400 ring-[1.2px] ring-food/45 shadow-sm",
  style: "bg-style/20 text-violet-700 dark:text-violet-400 ring-[1.2px] ring-style/45 shadow-sm",
  dining: "bg-dining/20 text-amber-700 dark:text-amber-400 ring-[1.2px] ring-dining/45 shadow-sm",
  foodorder: "bg-foodorder/20 text-red-700 dark:text-red-400 ring-[1.2px] ring-foodorder/45 shadow-sm",
} as const;

interface VerticalNavProps {
  apiKey?: string | null;
  swiggyToken?: string | null;
  selectedAddress?: ParsedAddress | null;
}

function getVerticalIdFromPathname(pathname: string): string {
  return pathname.replace(/^\//, "").split("/")[0] ?? "";
}

export function VerticalNav({
  apiKey = null,
  swiggyToken = null,
  selectedAddress,
}: VerticalNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingTargetVerticalId, setPendingTargetVerticalId] = useState<string | null>(null);
  const currentVerticalId = getVerticalIdFromPathname(location.pathname);
  const currentVertical = verticals[currentVerticalId];

  const gridCols = verticalList
    .map((v) => (v.id === "food" ? "1.3fr" : "1fr"))
    .join(" ");

  const pendingTargetVertical = useMemo(
    () => (pendingTargetVerticalId ? verticals[pendingTargetVerticalId] : undefined),
    [pendingTargetVerticalId],
  );

  const handleTabClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, targetVerticalId: string) => {
      if (targetVerticalId === currentVerticalId) return;

      if (
        isInstamartCrossTabSwitch(currentVerticalId, targetVerticalId) &&
        hasClearableInstamartState(currentVerticalId)
      ) {
        event.preventDefault();
        setPendingTargetVerticalId(targetVerticalId);
        setConfirmOpen(true);
      }
    },
    [currentVerticalId],
  );

  const handleConfirmSheetOpenChange = useCallback((nextOpen: boolean) => {
    setConfirmOpen(nextOpen);
    if (!nextOpen) {
      setPendingTargetVerticalId(null);
    }
  }, []);

  const handleConfirmSwitch = useCallback(() => {
    if (!pendingTargetVerticalId) return;
    const sourceVerticalId = currentVerticalId;
    const targetVerticalId = pendingTargetVerticalId;

    if (isInstamartCrossTabSwitch(sourceVerticalId, targetVerticalId)) {
      clearChatHistory(sourceVerticalId);
      void triggerBestEffortInstamartCartClear({
        verticalId: sourceVerticalId,
        apiKey,
        swiggyToken,
        selectedAddress,
      });
    }

    setConfirmOpen(false);
    setPendingTargetVerticalId(null);
    navigate(`/${targetVerticalId}`);
  }, [
    apiKey,
    currentVerticalId,
    navigate,
    pendingTargetVerticalId,
    selectedAddress,
    swiggyToken,
  ]);

  const handleCancelSwitch = useCallback(() => {
    setConfirmOpen(false);
    setPendingTargetVerticalId(null);
  }, []);

  return (
    <>
      <nav
        className="grid w-full gap-1 rounded-full border-[1.2px] border-border/75 bg-muted/85 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
        style={{ gridTemplateColumns: gridCols }}
        aria-label="Vertical navigation"
      >
        {verticalList.map((v) => (
          <NavLink
            key={v.id}
            to={`/${v.id}`}
            onClick={(event) => handleTabClick(event, v.id)}
            className={({ isActive }) =>
              cn(
                "flex min-h-10 items-center justify-center rounded-full px-2.5 py-2 text-[13px] font-semibold transition-all whitespace-nowrap",
                isActive
                  ? activeClasses[v.color]
                  : "text-muted-foreground/80 hover:bg-background/70 hover:text-foreground",
              )
            }
          >
            {({ isActive }) => {
              const Icon = iconMap[v.icon as keyof typeof iconMap];
              return (
                <span className="flex items-center gap-1.5" aria-current={isActive ? "page" : undefined}>
                  <Icon className="h-3.5 w-3.5" />
                  {v.tabName}
                </span>
              );
            }}
          </NavLink>
        ))}
      </nav>

      <Sheet open={confirmOpen} onOpenChange={handleConfirmSheetOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          overlayClassName="backdrop-blur-[3px]"
          onCloseAutoFocus={(event) => event.preventDefault()}
          className="min-h-0 p-0"
        >
          <SheetHeader className="px-4 pb-2 pt-8 pr-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center">
              <span aria-hidden className="h-8 w-8" />
              <SheetTitle className="text-base text-center leading-tight">
                Switch tab and clear
                <br />
                current session?
              </SheetTitle>
              <SheetClose className="ring-offset-background focus-visible:ring-ring justify-self-end inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/90 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none">
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </SheetClose>
            </div>
            <SheetDescription className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Switching from {currentVertical?.tabName ?? "this tab"} to{" "}
              {pendingTargetVertical?.tabName ?? "the other tab"} will clear the current tab chat.
              We will also try clearing the current Instamart cart in the background to avoid
              duplicate cart state across Nutrition and Style.
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 pb-14">
            <div className="mt-4 space-y-2.5">
              <Button
                onClick={handleConfirmSwitch}
                className="w-full rounded-xl"
              >
                Clear and switch
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelSwitch}
                className="w-full rounded-xl"
              >
                Stay here
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
