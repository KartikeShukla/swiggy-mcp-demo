import { NavLink } from "react-router-dom";
import { verticalList } from "@/verticals";
import { cn } from "@/lib/utils";

const activeClasses = {
  food: "bg-food/10 text-food",
  style: "bg-style/10 text-style",
  dining: "bg-dining/10 text-dining",
  foodorder: "bg-foodorder/10 text-foodorder",
} as const;

const hoverClasses = {
  food: "hover:text-food",
  style: "hover:text-style",
  dining: "hover:text-dining",
  foodorder: "hover:text-foodorder",
} as const;

export function VerticalNav() {
  return (
    <nav className="flex gap-1" aria-label="Vertical navigation">
      {verticalList.map((v) => (
        <NavLink
          key={v.id}
          to={`/${v.id}`}
          className={({ isActive }) =>
            cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors",
              hoverClasses[v.color],
              isActive && activeClasses[v.color],
            )
          }
        >
          {({ isActive }) => (
            <span aria-current={isActive ? "page" : undefined}>{v.name}</span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
