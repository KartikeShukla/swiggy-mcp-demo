import { useCallback, useMemo, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { verticals } from "@/verticals";
import type {
  CartAddSelectionItem,
  VerticalConfig,
  ParsedAddress,
  ChatAction,
  ParsedProduct,
  CartState,
} from "@/lib/types";
import { useChat } from "@/hooks/useChat";
import { useCart } from "@/hooks/useCart";
import { sanitizeUntrustedPromptText } from "@/lib/prompt-safety";
import { ErrorBoundary } from "../ErrorBoundary";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { CartFloatingButton } from "../cart/CartFloatingButton";
import { CartPanel } from "../cart/CartPanel";
import { Plus } from "lucide-react";
import styleGif from "@/assets/verticals/style.gif";
import diningGif from "@/assets/verticals/dining.gif";
import foodorderGif from "@/assets/verticals/foodorder.gif";
import {
  getActionMessage,
  isCartAddSelectionAction,
  isCartUpdateItemAction,
  isRestaurantSelectAction,
  isSelectAddressAction,
  isSlotSelectAction,
} from "@/lib/chat-actions";
import {
  buildOptimisticCartKey,
  findOptimisticCartKeyById,
  findOptimisticCartKeyByName,
  type OptimisticCartEntry,
} from "@/lib/cart/optimistic-cart";

const gifMap: Record<string, string> = {
  food: "https://media.tenor.com/oiiF1L5rIdYAAAAM/chefcat-cat-chef.gif",
  style: styleGif,
  dining: diningGif,
  foodorder: foodorderGif,
};
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

function toSafeSelectionMetadata(items: CartAddSelectionItem[]) {
  return items.map((item) => ({
    ui_product_id: item.uiProductId,
    backend_product_id: item.backendProductId,
    backend_variant_id: item.backendVariantId,
    name: sanitizeUntrustedPromptText(item.name, 80),
    quantity: item.quantity,
    brand: item.brand ? sanitizeUntrustedPromptText(item.brand, 60) : undefined,
    variant: item.variantLabel ? sanitizeUntrustedPromptText(item.variantLabel, 40) : undefined,
    price: item.price,
    restaurant: item.restaurantName ? sanitizeUntrustedPromptText(item.restaurantName, 80) : undefined,
  }));
}

function buildTransportMessageForAction(
  action: ChatAction,
  verticalId: string,
  lockedRestaurant: string | null,
): string {
  const message = getActionMessage(action).trim();
  if (!message) return "";

  if (isCartAddSelectionAction(action)) {
    const safeItems = toSafeSelectionMetadata(action.items);
    if (safeItems.length === 0) return message;

    if (verticalId === "foodorder") {
      return [
        "Cart update request (menu mode):",
        lockedRestaurant
          ? `Selected restaurant: ${sanitizeUntrustedPromptText(lockedRestaurant, 80)}.`
          : action.restaurantName
            ? `Selected restaurant: ${sanitizeUntrustedPromptText(action.restaurantName, 80)}.`
            : "Selected restaurant: currently opened menu context.",
        `${message}.`,
        `Structured items: ${JSON.stringify(safeItems)}.`,
        "Execute cart update directly from this selected-item metadata.",
        "Do not run restaurant discovery.",
        "Do not run menu discovery or fetch/show menu items for this restaurant again unless the user explicitly asks to see the menu.",
      ].join(" ");
    }

    return [
      `${message}.`,
      `Selected cart items metadata: ${JSON.stringify(safeItems)}.`,
      "Execute cart update directly from this selected-item metadata.",
      "Do not ask to reconfirm size/variant unless selected metadata is missing or conflicting across multiple exact matches.",
    ].join(" ");
  }

  if (isCartUpdateItemAction(action)) {
    const safeItemName = sanitizeUntrustedPromptText(action.itemName, 80);
    return [
      `${message}.`,
      `Cart item metadata: ${JSON.stringify({
        item_id: action.itemId,
        item_name: safeItemName,
        target_quantity: action.targetQuantity,
        restaurant: action.restaurantName ? sanitizeUntrustedPromptText(action.restaurantName, 80) : undefined,
      })}.`,
      "Execute this cart update directly for the referenced item. Do not ask to reconfirm unless the item cannot be resolved.",
    ].join(" ");
  }

  if (isRestaurantSelectAction(action)) {
    return [
      `${message}.`,
      `Selected restaurant metadata: ${JSON.stringify({
        restaurant_id: action.restaurantId,
        restaurant_name: sanitizeUntrustedPromptText(action.restaurantName, 80),
        mode: action.mode,
      })}.`,
      action.mode === "menu"
        ? "Lock this restaurant for all subsequent menu/cart calls unless the user explicitly asks to change restaurant."
        : "Use this exact restaurant identity for availability and booking checks.",
    ].join(" ");
  }

  if (isSlotSelectAction(action)) {
    return [
      `${message}.`,
      `Selected slot metadata: ${JSON.stringify({
        slot_time: sanitizeUntrustedPromptText(action.slotTime, 40),
        slot_id: action.slotId,
        slot_token: action.slotToken,
        restaurant_name: action.restaurantName ? sanitizeUntrustedPromptText(action.restaurantName, 80) : undefined,
        restaurant_id: action.restaurantId,
      })}.`,
      "Use this slot selection directly for availability/booking flow. Do not ask to reconfirm unless the slot token/id is invalid or unavailable.",
    ].join(" ");
  }

  return message;
}

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
  const [pendingSelection, setPendingSelection] = useState<
    Record<string, { product: ParsedProduct; quantity: number }>
  >({});
  const [lockedRestaurant, setLockedRestaurant] = useState<string | null>(null);
  const [optimisticCartItems, setOptimisticCartItems] = useState<Record<string, OptimisticCartEntry>>({});
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

  const applyFoodOrderOptimisticAction = useCallback((action: ChatAction, actionText: string) => {
    if (vertical.id !== "foodorder" || cart) return;

    if (isCartUpdateItemAction(action)) {
      const qty = action.targetQuantity;
      if (!Number.isFinite(qty) || qty < 0) return;
      setOptimisticCartItems((prev) => {
        if (Object.keys(prev).length === 0) return prev;
        const next = { ...prev };
        const keyById = findOptimisticCartKeyById(next, action.itemId, lockedRestaurant);
        const keyByName = findOptimisticCartKeyByName(next, action.itemName, lockedRestaurant);
        const key = keyById || keyByName;
        if (!key) return prev;
        const item = next[key];
        if (!item) return prev;
        if (qty === 0) {
          delete next[key];
        } else {
          next[key] = { ...item, quantity: qty, updatedAt: Date.now() };
        }
        return next;
      });
      return;
    }

    const removeMatch = actionText.match(/^Remove (.+) from my cart$/i);
    if (removeMatch?.[1]) {
      const target = removeMatch[1].trim();
      setOptimisticCartItems((prev) => {
        if (Object.keys(prev).length === 0) return prev;
        const next = { ...prev };
        const key = findOptimisticCartKeyByName(next, target, lockedRestaurant);
        if (key) {
          delete next[key];
        }
        return next;
      });
      return;
    }

    const changeQtyMatch = actionText.match(/^Change (.+) quantity to (\d+)$/i);
    if (changeQtyMatch?.[1] && changeQtyMatch?.[2]) {
      const target = changeQtyMatch[1].trim();
      const qty = Number.parseInt(changeQtyMatch[2], 10);
      if (!Number.isFinite(qty) || qty < 0) return;
      setOptimisticCartItems((prev) => {
        if (Object.keys(prev).length === 0) return prev;
        const next = { ...prev };
        const key = findOptimisticCartKeyByName(next, target, lockedRestaurant);
        if (!key) return prev;
        const item = next[key];
        if (!item) return prev;
        if (qty === 0) {
          delete next[key];
        } else {
          next[key] = { ...item, quantity: qty, updatedAt: Date.now() };
        }
        return next;
      });
    }
  }, [cart, lockedRestaurant, vertical.id]);

  const handleAction = useCallback(
    (action: ChatAction) => {
      if (isSelectAddressAction(action) && onSelectAddressFromChat) {
        onSelectAddressFromChat(action.address);
      }
      const message = getActionMessage(action).trim();
      if (!message) return;

      if (isRestaurantSelectAction(action) && vertical.id === "foodorder") {
        const nextRestaurant = sanitizeUntrustedPromptText(action.restaurantName, 80);
        if (action.mode === "menu" && nextRestaurant !== lockedRestaurant) {
          setPendingSelection({});
          if (!cart) setOptimisticCartItems({});
        }
        if (action.mode === "menu") {
          setLockedRestaurant(nextRestaurant);
        }
      } else {
        const menuOpenMatch = message.match(/^Open menu for restaurant:\s*(.+)$/i);
        if (menuOpenMatch?.[1]) {
          const nextRestaurant = sanitizeUntrustedPromptText(menuOpenMatch[1], 80);
          if (vertical.id === "foodorder" && nextRestaurant !== lockedRestaurant) {
            setPendingSelection({});
            if (!cart) setOptimisticCartItems({});
          }
          setLockedRestaurant(nextRestaurant);
        } else if (
          vertical.id === "foodorder" &&
          /\b(change|switch|different|another|new)\b.*\brestaurant\b|\bfind\b.*\brestaurants?\b|\bshow\b.*\brestaurants?\b/i.test(message)
        ) {
          setLockedRestaurant(null);
          setPendingSelection({});
          if (!cart) setOptimisticCartItems({});
        }
      }

      applyFoodOrderOptimisticAction(action, message);

      const transportMessage = buildTransportMessageForAction(
        action,
        vertical.id,
        lockedRestaurant,
      );
      void sendMessage(message, { apiText: transportMessage || message });
    },
    [
      applyFoodOrderOptimisticAction,
      cart,
      lockedRestaurant,
      onSelectAddressFromChat,
      sendMessage,
      vertical.id,
    ],
  );

  const handleUnifiedAddToCart = useCallback(async () => {
    if (!pendingSelectedItems.length) return;
    const parts = pendingSelectedItems.map(
      (entry) => `${entry.quantity}x ${sanitizeUntrustedPromptText(entry.product.name, 80)}`,
    );
    const cartAddAction: ChatAction = {
      kind: "cart_add_selection",
      message: `Add to cart: ${parts.join(", ")}`,
      verticalId: vertical.id,
      restaurantName: lockedRestaurant || undefined,
      items: pendingSelectedItems.map((entry) => ({
        uiProductId: entry.product.id,
        name: sanitizeUntrustedPromptText(entry.product.name, 80),
        quantity: entry.quantity,
        brand: entry.product.brand
          ? sanitizeUntrustedPromptText(entry.product.brand, 60)
          : undefined,
        variantLabel: entry.product.variantLabel || entry.product.quantity,
        price: entry.product.price,
        backendProductId: entry.product.backendProductId,
        backendVariantId: entry.product.backendVariantId,
        restaurantName: entry.product.restaurantName || lockedRestaurant || undefined,
      })),
    };
    const addToCartMessage = buildTransportMessageForAction(
      cartAddAction,
      vertical.id,
      lockedRestaurant,
    );
    const ok = await sendMessage(cartAddAction.message, { apiText: addToCartMessage });
    if (vertical.id === "foodorder" && ok) {
      setOptimisticCartItems((prev) => {
        const next = { ...prev };
        const now = Date.now();
        for (const entry of pendingSelectedItems) {
          const key = buildOptimisticCartKey(entry.product, {
            verticalId: vertical.id,
            lockedRestaurant,
          });
          const existing = next[key];
          next[key] = {
            id: entry.product.id,
            name: entry.product.name,
            price: entry.product.price ?? existing?.price ?? 0,
            quantity: (existing?.quantity ?? 0) + entry.quantity,
            image: entry.product.image,
            restaurantScope: lockedRestaurant || entry.product.restaurantName || null,
            updatedAt: now,
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
            lockedRestaurant={lockedRestaurant}
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
          <div className="flex items-center justify-end gap-[13px]">
            {isUnifiedSelectionVertical && pendingCount > 0 && (
              <Button
                onClick={handleUnifiedAddToCart}
                disabled={inputDisabled}
                className="pointer-events-auto h-12 whitespace-nowrap rounded-full border-2 border-orange-400 bg-[#4a3527] px-4 has-[>svg]:px-4 text-sm font-semibold text-white shadow-[0_8px_16px_-12px_rgba(249,115,22,0.11)] hover:bg-[#553d2d]"
              >
                <Plus className="h-5 w-5" />
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
