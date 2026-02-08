import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { CART_BOUNCE_MS } from "@/lib/constants";

export function CartFloatingButton({
  count,
  onClick,
  accentColor,
}: {
  count: number;
  onClick: () => void;
  accentColor: string;
}) {
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    setBounce(true);
    const t = setTimeout(() => setBounce(false), CART_BOUNCE_MS);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <button
      onClick={onClick}
      aria-label={`View cart, ${count} ${count === 1 ? "item" : "items"}`}
      className={`absolute bottom-20 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform ${
        bounce ? "scale-110" : "scale-100"
      }`}
      style={{ backgroundColor: `var(--color-${accentColor})` }}
    >
      <ShoppingCart className="h-5 w-5 text-white" />
      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold shadow"
        style={{ color: `var(--color-${accentColor})` }}
      >
        {count}
      </span>
    </button>
  );
}
