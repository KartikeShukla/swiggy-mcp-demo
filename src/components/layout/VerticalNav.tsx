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
  food: "bg-food/20 text-green-700 dark:text-green-400 ring-1 ring-food/30",
  style: "bg-style/20 text-violet-700 dark:text-violet-400 ring-1 ring-style/30",
  dining: "bg-dining/20 text-amber-700 dark:text-amber-400 ring-1 ring-dining/30",
  foodorder: "bg-foodorder/20 text-red-700 dark:text-red-400 ring-1 ring-foodorder/30",
} as const;

export function VerticalNav() {
  return (
    <nav className="flex gap-1.5 justify-center px-1 py-1 overflow-x-auto scrollbar-none" aria-label="Vertical navigation">
      {verticalList.map((v) => (
        <NavLink
          key={v.id}
          to={`/${v.id}`}
          className={({ isActive }) =>
            cn(
              "rounded-full px-3.5 py-2 text-[13px] font-semibold transition-all whitespace-nowrap",
              isActive
                ? activeClasses[v.color]
                : "text-muted-foreground/80 hover:text-muted-foreground",
            )
          }
        >
          {({ isActive }) => {
            const Icon = iconMap[v.icon as keyof typeof iconMap];
            return (
              <span className="flex items-center gap-1" aria-current={isActive ? "page" : undefined}>
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
