import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function CartFloatingButton({
  count,
  onClick,
  className,
}: {
  count: number;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      key={count}
      onClick={onClick}
      aria-label={`View cart, ${count} ${count === 1 ? "item" : "items"}`}
      size="icon-lg"
      className={`h-14 w-14 rounded-full border border-orange-200/30 bg-gradient-to-b from-orange-400 to-orange-600 text-white shadow-[0_8px_18px_-10px_rgba(249,115,22,0.55)] ring-1 ring-orange-300/25 animate-[scale-in_220ms_ease-out,cart-bounce_340ms_ease-out] transition-transform hover:scale-105 active:scale-[0.98] ${className ?? "absolute bottom-[6.9rem] right-5 z-50"}`}
    >
      <ShoppingCart className="h-6 w-6 stroke-[2.3]" />
      <Badge
        className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full border-[1.5px] border-background/90 bg-zinc-900 px-1 text-xs font-extrabold text-orange-500 shadow-md shadow-black/40"
      >
        {count}
      </Badge>
    </Button>
  );
}
