import { useMemo, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { findLatestCartState } from "@/lib/cart/latest-cart";

export function useCart(messages: ChatMessage[], verticalId: string) {
  const cart = useMemo(
    () => findLatestCartState(messages, verticalId),
    [messages, verticalId],
  );
  const [isOpen, setIsOpen] = useState(false);

  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return { cart, isOpen, setIsOpen, itemCount };
}
