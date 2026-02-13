import { useCallback, useMemo, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { verticals } from "@/verticals";
import type { VerticalConfig, ParsedAddress, ChatAction, ParsedProduct, CartState } from "@/lib/types";
import { useChat } from "@/hooks/useChat";
import { useCart } from "@/hooks/useCart";
import { sanitizeUntrustedPromptText } from "@/lib/prompt-safety";
import { ErrorBoundary } from "../ErrorBoundary";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { CartFloatingButton } from "../cart/CartFloatingButton";
import { CartPanel } from "../cart/CartPanel";
import { ShoppingCart } from "lucide-react";
import styleGif from "@/assets/verticals/style.gif";
import diningGif from "@/assets/verticals/dining.gif";
import foodorderGif from "@/assets/verticals/foodorder.gif";
import { getActionMessage, isSelectAddressAction } from "@/lib/chat-actions";

const gifMap: Record<string, string> = {
  food: "https://media.tenor.com/oiiF1L5rIdYAAAAM/chefcat-cat-chef.gif",
  style: styleGif,
  dining: diningGif,
  foodorder: foodorderGif,
};
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

function ChatViewInner({
  vertical,
  apiKey,
  swiggyToken,
  onAuthError,
  selectedAddress,
  onSelectAddressFromChat,
  onAddressError,
}: {
  vertical: VerticalConfig;
  apiKey: string | null;
  swiggyToken: string | null;
  onAuthError?: () => void;
  selectedAddress?: ParsedAddress | null;
  onSelectAddressFromChat?: (address: ParsedAddress) => void;
  onAddressError?: () => void;
}) {
  type OptimisticCartItem = CartState["items"][number];
  const [pendingSelection, setPendingSelection] = useState<
    Record<string, { product: ParsedProduct; quantity: number }>
  >({});
  const [lockedRestaurant, setLockedRestaurant] = useState<string | null>(null);
  const [optimisticCartItems, setOptimisticCartItems] = useState<Record<string, OptimisticCartItem>>({});
  const {
    messages,
    loading,
    loadingLabel,
    loadingElapsedMs,
    error,
    sendMessage,
    cooldownRemaining,
    inputDisabled,
  } = useChat(
    vertical,
    apiKey,
    swiggyToken,
    onAuthError,
    onAddressError,
    selectedAddress,
  );
  const { cart, isOpen, setIsOpen } = useCart(messages, vertical.id);
  const isUnifiedSelectionVertical =
    vertical.id === "food" || vertical.id === "style" || vertical.id === "foodorder";

  const sharedSelection = useMemo(() => {
    if (!isUnifiedSelectionVertical) return undefined;
    return {
      quantities: Object.fromEntries(
        Object.entries(pendingSelection).map(([id, value]) => [id, value.quantity]),
      ),
      onIncrement: (product: ParsedProduct) => {
        setPendingSelection((prev) => {
          const existing = prev[product.id];
          return {
            ...prev,
            [product.id]: {
              product: existing?.product || product,
              quantity: (existing?.quantity || 0) + 1,
            },
          };
        });
      },
      onDecrement: (productId: string) => {
        setPendingSelection((prev) => {
          const existing = prev[productId];
          if (!existing) return prev;
          const nextQty = existing.quantity - 1;
          if (nextQty <= 0) {
            const rest = { ...prev };
            delete rest[productId];
            return rest;
          }
          return {
            ...prev,
            [productId]: {
              ...existing,
              quantity: nextQty,
            },
          };
        });
      },
    };
  }, [isUnifiedSelectionVertical, pendingSelection]);

  const pendingSelectedItems = useMemo(
    () => Object.values(pendingSelection),
    [pendingSelection],
  );
  const pendingCount = useMemo(
    () => pendingSelectedItems.reduce((sum, item) => sum + item.quantity, 0),
    [pendingSelectedItems],
  );

  const optimisticCart = useMemo<CartState | null>(() => {
    const items = Object.values(optimisticCartItems);
    if (items.length === 0) return null;
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return {
      items,
      subtotal,
      deliveryFee: 0,
      total: subtotal,
    };
  }, [optimisticCartItems]);

  const effectiveCart = cart ?? optimisticCart;
  const effectiveItemCount = effectiveCart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  const applyFoodOrderOptimisticAction = useCallback((actionText: string) => {
    if (vertical.id !== "foodorder" || cart) return;
    if (Object.keys(optimisticCartItems).length === 0) return;

    const removeMatch = actionText.match(/^Remove (.+) from my cart$/i);
    if (removeMatch?.[1]) {
      const target = removeMatch[1].trim().toLowerCase();
      setOptimisticCartItems((prev) => {
        const next = { ...prev };
        const entry = Object.entries(next).find(([, item]) => item.name.trim().toLowerCase() === target);
        if (entry) {
          delete next[entry[0]];
        }
        return next;
      });
      return;
    }

    const changeQtyMatch = actionText.match(/^Change (.+) quantity to (\d+)$/i);
    if (changeQtyMatch?.[1] && changeQtyMatch?.[2]) {
      const target = changeQtyMatch[1].trim().toLowerCase();
      const qty = Number.parseInt(changeQtyMatch[2], 10);
      if (!Number.isFinite(qty) || qty < 0) return;
      setOptimisticCartItems((prev) => {
        const next = { ...prev };
        const entry = Object.entries(next).find(([, item]) => item.name.trim().toLowerCase() === target);
        if (!entry) return prev;
        const [key, item] = entry;
        if (qty === 0) {
          delete next[key];
        } else {
          next[key] = { ...item, quantity: qty };
        }
        return next;
      });
    }
  }, [cart, optimisticCartItems, vertical.id]);

  const handleAction = useCallback(
    (action: ChatAction) => {
      if (isSelectAddressAction(action) && onSelectAddressFromChat) {
        onSelectAddressFromChat(action.address);
      }
      const message = getActionMessage(action).trim();
      if (!message) return;
      const menuOpenMatch = message.match(/^Open menu for restaurant:\s*(.+)$/i);
      if (menuOpenMatch?.[1]) {
        setLockedRestaurant(sanitizeUntrustedPromptText(menuOpenMatch[1], 80));
      }
      applyFoodOrderOptimisticAction(message);
      void sendMessage(message);
    },
    [applyFoodOrderOptimisticAction, onSelectAddressFromChat, sendMessage],
  );

  const handleUnifiedAddToCart = useCallback(async () => {
    if (!pendingSelectedItems.length) return;
    const parts = pendingSelectedItems.map(
      (entry) => `${entry.quantity}x ${sanitizeUntrustedPromptText(entry.product.name, 80)}`,
    );
    const addToCartMessage = vertical.id === "foodorder"
      ? [
          "Cart update request (menu mode):",
          lockedRestaurant
            ? `Selected restaurant: ${sanitizeUntrustedPromptText(lockedRestaurant, 80)}.`
            : "Selected restaurant: currently opened menu context.",
          `Add to cart: ${parts.join(", ")}.`,
          `Structured items: ${JSON.stringify(
            pendingSelectedItems.map((entry) => ({
              item_id: entry.product.id,
              name: sanitizeUntrustedPromptText(entry.product.name, 80),
              quantity: entry.quantity,
            })),
          )}.`,
          "Execute cart update directly. Do not run restaurant discovery.",
          "Do not run menu discovery or fetch/show menu items for this restaurant again unless the user explicitly asks to see the menu.",
        ].join(" ")
      : `Add to cart: ${parts.join(", ")}`;
    const ok = await sendMessage(addToCartMessage);
    if (vertical.id === "foodorder" && ok) {
      setOptimisticCartItems((prev) => {
        const next = { ...prev };
        for (const entry of pendingSelectedItems) {
          const existing = next[entry.product.id];
          next[entry.product.id] = {
            id: entry.product.id,
            name: entry.product.name,
            price: entry.product.price ?? existing?.price ?? 0,
            quantity: (existing?.quantity ?? 0) + entry.quantity,
            image: entry.product.image,
          };
        }
        return next;
      });
    }
    if (ok) {
      setPendingSelection({});
    }
  }, [lockedRestaurant, pendingSelectedItems, sendMessage, vertical.id]);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full flex-col relative">
      {/* Error display — pinned to top, suppressed during cooldown (countdown in input is sufficient) */}
      {error && cooldownRemaining <= 0 && (
        <div className="shrink-0 px-4 py-2">
          <div className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive" role="alert">
            {error}
          </div>
        </div>
      )}

      {/* Messages or empty state */}
      {hasMessages ? (
        <ErrorBoundary>
          <MessageList
            messages={messages}
            loading={loading}
            loadingLabel={loadingLabel}
            loadingElapsedMs={loadingElapsedMs}
            verticalId={vertical.id}
            onAction={handleAction}
            sharedSelection={sharedSelection}
          />
        </ErrorBoundary>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-5 pt-4 pb-20">
          <div className="mb-4 h-[6.3rem] w-[6.3rem] overflow-hidden rounded-2xl">
            <img
              src={gifMap[vertical.id]}
              alt={vertical.name}
              className="h-full w-full object-cover"
            />
          </div>
          <p className="mb-6 max-w-md text-center text-xs text-muted-foreground leading-relaxed">
            {vertical.welcomeMessage}
          </p>
          <div className="flex flex-col gap-1.5 w-full">
            {vertical.examplePrompts.map((prompt) => (
              <Button
                key={prompt}
                variant="outline"
                className="rounded-xl text-xs h-auto py-2 px-3.5 w-full whitespace-normal text-center leading-relaxed"
                onClick={() => handleAction(prompt)}
                disabled={inputDisabled || !apiKey}
              >
                {prompt}
              </Button>
            ))}
          </div>
        </div>
      )}

      {(effectiveItemCount > 0 || (isUnifiedSelectionVertical && pendingCount > 0)) && (
        <div className="pointer-events-none absolute bottom-[6.9rem] left-4 right-4 z-50">
          <div className="flex items-center justify-end gap-4">
            {isUnifiedSelectionVertical && pendingCount > 0 && (
              <Button
                onClick={handleUnifiedAddToCart}
                disabled={inputDisabled}
                className="pointer-events-auto h-12 whitespace-nowrap rounded-full border-2 border-orange-400 bg-[#4a3527] px-4 has-[>svg]:px-4 text-sm font-semibold text-white shadow-[0_8px_16px_-12px_rgba(249,115,22,0.11)] hover:bg-[#553d2d]"
              >
                <ShoppingCart className="h-5 w-5" />
                Add {pendingCount} {pendingCount === 1 ? "item" : "items"} to cart
              </Button>
            )}
            {effectiveItemCount > 0 && (
              <CartFloatingButton
                count={effectiveItemCount}
                onClick={() => setIsOpen(true)}
                className="pointer-events-auto z-50 h-12 w-12"
              />
            )}
          </div>
        </div>
      )}

      {/* Cart bottom sheet */}
      <Sheet open={isOpen && !!effectiveCart} onOpenChange={setIsOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          overlayClassName="backdrop-blur-[3px]"
          onCloseAutoFocus={(event) => event.preventDefault()}
          className="min-h-0 p-0 flex flex-col"
        >
          {effectiveCart && (
            <CartPanel
              cart={effectiveCart}
              onClose={() => setIsOpen(false)}
              onAction={handleAction}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Input — absolutely positioned, overlays messages with gradient */}
      <ChatInput
        onSend={handleAction}
        disabled={inputDisabled || !apiKey}
        cooldownSeconds={cooldownRemaining > 0 ? Math.ceil(cooldownRemaining / 1000) : undefined}
      />
    </div>
  );
}

export function ChatView(props: {
  apiKey: string | null;
  swiggyToken: string | null;
  onAuthError?: () => void;
  selectedAddress?: ParsedAddress | null;
  onSelectAddressFromChat?: (address: ParsedAddress) => void;
  onAddressError?: () => void;
}) {
  const { verticalId } = useParams<{ verticalId: string }>();
  const vertical = verticalId ? verticals[verticalId] : undefined;

  if (!vertical) return <Navigate to="/" replace />;

  // Key on verticalId so the inner component remounts with fresh hook state
  return <ChatViewInner key={verticalId} vertical={vertical} {...props} />;
}
