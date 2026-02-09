import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { CART_BOUNCE_MS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function CartFloatingButton({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    setBounce(true);
    const t = setTimeout(() => setBounce(false), CART_BOUNCE_MS);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <Button
      onClick={onClick}
      aria-label={`View cart, ${count} ${count === 1 ? "item" : "items"}`}
      size="icon-lg"
      className={`absolute bottom-28 right-4 z-40 rounded-full shadow-lg shadow-primary/20 animate-[scale-in_200ms_ease-out] transition-transform ${
        bounce ? "scale-105" : "scale-100"
      }`}
    >
      <ShoppingCart className="h-5 w-5" />
      <Badge
        className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full border-2 border-background p-0 text-[10px] font-bold bg-card text-primary"
      >
        {count}
      </Badge>
    </Button>
  );
}
