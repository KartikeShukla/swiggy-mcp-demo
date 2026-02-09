import { Link } from "react-router-dom";
import { Bike, Salad, Sparkles, UtensilsCrossed } from "lucide-react";
import type { VerticalConfig } from "@/lib/types";
import { Card } from "@/components/ui/card";

const iconMap = {
  Salad,
  Sparkles,
  UtensilsCrossed,
  Bike,
} as const;

const colorClasses = {
  food: {
    border: "border-food/30",
    text: "text-food",
    hoverBorder: "hover:border-food",
    iconBg: "bg-food/10",
  },
  style: {
    border: "border-style/30",
    text: "text-style",
    hoverBorder: "hover:border-style",
    iconBg: "bg-style/10",
  },
  dining: {
    border: "border-dining/30",
    text: "text-dining",
    hoverBorder: "hover:border-dining",
    iconBg: "bg-dining/10",
  },
  foodorder: {
    border: "border-foodorder/30",
    text: "text-foodorder",
    hoverBorder: "hover:border-foodorder",
    iconBg: "bg-foodorder/10",
  },
} as const;

export function VerticalCard({ vertical }: { vertical: VerticalConfig }) {
  const Icon = iconMap[vertical.icon as keyof typeof iconMap];
  const colors = colorClasses[vertical.color];

  return (
    <Link to={`/${vertical.id}`}>
      <Card
        className={`group rounded-xl border ${colors.border} ${colors.hoverBorder} p-3 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`shrink-0 inline-flex rounded-xl ${colors.iconBg} p-2.5`}
          >
            <Icon className={`h-6 w-6 ${colors.text}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-card-foreground">
              {vertical.name}
            </h3>
            <p className={`text-xs font-medium ${colors.text}`}>
              {vertical.tagline}
            </p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {vertical.description}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
