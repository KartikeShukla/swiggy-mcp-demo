import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { VerticalConfig } from "@/lib/types";
import { Card } from "@/components/ui/card";

import foodGif from "@/assets/verticals/food.gif";
import styleGif from "@/assets/verticals/style.gif";
import diningGif from "@/assets/verticals/dining.gif";
import foodorderGif from "@/assets/verticals/foodorder.gif";

const gifMap: Record<string, string> = {
  food: foodGif,
  style: styleGif,
  dining: diningGif,
  foodorder: foodorderGif,
};

const colorClasses = {
  food: {
    border: "border-food/30",
    text: "text-food",
    hoverBorder: "hover:border-food",
  },
  style: {
    border: "border-style/30",
    text: "text-style",
    hoverBorder: "hover:border-style",
  },
  dining: {
    border: "border-dining/30",
    text: "text-dining",
    hoverBorder: "hover:border-dining",
  },
  foodorder: {
    border: "border-foodorder/30",
    text: "text-foodorder",
    hoverBorder: "hover:border-foodorder",
  },
} as const;

export function VerticalCard({ vertical }: { vertical: VerticalConfig }) {
  const gif = gifMap[vertical.id];
  const colors = colorClasses[vertical.color];

  return (
    <Link to={`/${vertical.id}`}>
      <Card
        className={`group rounded-xl border ${colors.border} ${colors.hoverBorder} p-3 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 h-16 w-16 overflow-hidden rounded-xl">
            <img
              src={gif}
              alt={vertical.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-card-foreground">
                {vertical.name}
              </h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {vertical.description}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
