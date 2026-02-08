import { Link } from "react-router-dom";
import { Bike, Salad, Sparkles, UtensilsCrossed } from "lucide-react";
import type { VerticalConfig } from "@/lib/types";

const iconMap = {
  Salad,
  Sparkles,
  UtensilsCrossed,
  Bike,
} as const;

const colorClasses = {
  food: {
    bg: "bg-food-light",
    border: "border-food/30",
    text: "text-food",
    hoverBorder: "hover:border-food",
    iconBg: "bg-food/10",
  },
  style: {
    bg: "bg-style-light",
    border: "border-style/30",
    text: "text-style",
    hoverBorder: "hover:border-style",
    iconBg: "bg-style/10",
  },
  dining: {
    bg: "bg-dining-light",
    border: "border-dining/30",
    text: "text-dining",
    hoverBorder: "hover:border-dining",
    iconBg: "bg-dining/10",
  },
  foodorder: {
    bg: "bg-foodorder-light",
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
    <Link
      to={`/${vertical.id}`}
      className={`group block rounded-2xl border-2 ${colors.border} ${colors.hoverBorder} bg-white p-6 transition-all hover:shadow-lg`}
    >
      <div
        className={`mb-4 inline-flex rounded-xl ${colors.iconBg} p-3`}
      >
        <Icon className={`h-8 w-8 ${colors.text}`} />
      </div>
      <h3 className="mb-1 text-xl font-semibold text-gray-900">
        {vertical.name}
      </h3>
      <p className={`mb-3 text-sm font-medium ${colors.text}`}>
        {vertical.tagline}
      </p>
      <p className="mb-4 text-sm text-gray-600 leading-relaxed">{vertical.description}</p>
      <div className="flex items-center gap-1.5">
        <span
          className={`text-sm font-medium ${colors.text} group-hover:underline`}
        >
          Try it
        </span>
        <span className={`text-sm ${colors.text} transition-transform group-hover:translate-x-0.5`}>
          &rarr;
        </span>
      </div>
    </Link>
  );
}
