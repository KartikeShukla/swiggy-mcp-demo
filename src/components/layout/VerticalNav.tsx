import { NavLink } from "react-router-dom";
import { Bike, Salad, Sparkles, UtensilsCrossed } from "lucide-react";
import { verticalList } from "@/verticals";
import { cn } from "@/lib/utils";

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

export function VerticalNav() {
  const gridCols = verticalList
    .map((v) => (v.id === "food" ? "1.3fr" : "1fr"))
    .join(" ");

  return (
    <nav
      className="grid w-full gap-1 rounded-full border-[1.2px] border-border/75 bg-muted/85 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
      style={{ gridTemplateColumns: gridCols }}
      aria-label="Vertical navigation"
    >
      {verticalList.map((v) => (
        <NavLink
          key={v.id}
          to={`/${v.id}`}
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
  );
}
