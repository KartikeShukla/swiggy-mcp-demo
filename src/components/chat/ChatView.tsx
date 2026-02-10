import { useCallback, useMemo, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { verticals } from "@/verticals";
import type { VerticalConfig, ParsedAddress, ChatAction, ParsedProduct } from "@/lib/types";
import { useChat } from "@/hooks/useChat";
import { useCart } from "@/hooks/useCart";
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
  const [pendingSelection, setPendingSelection] = useState<
    Record<string, { product: ParsedProduct; quantity: number }>
  >({});
  const {
    messages,
    loading,
    loadingLabel,
    loadingElapsedMs,
    error,
    sendMessage,
  } = useChat(
    vertical,
    apiKey,
    swiggyToken,
    onAuthError,
    onAddressError,
    selectedAddress,
  );
  const { cart, isOpen, setIsOpen, itemCount } = useCart(messages, vertical.id);
  const isUnifiedSelectionVertical = vertical.id === "food" || vertical.id === "style";

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

  const handleAction = useCallback(
    (action: ChatAction) => {
      if (isSelectAddressAction(action) && onSelectAddressFromChat) {
        onSelectAddressFromChat(action.address);
      }
      const message = getActionMessage(action).trim();
      if (!message) return;
      void sendMessage(message);
    },
    [onSelectAddressFromChat, sendMessage],
  );

  const handleUnifiedAddToCart = useCallback(() => {
    if (!pendingSelectedItems.length) return;
    const parts = pendingSelectedItems.map(
      (entry) => `${entry.quantity}x ${entry.product.name}`,
    );
    handleAction(`Add to cart: ${parts.join(", ")}`);
    setPendingSelection({});
  }, [handleAction, pendingSelectedItems]);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full flex-col relative">
      {/* Error display — pinned to top, in flow so it doesn't overlap content */}
      {error && (
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
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {vertical.name}
          </h2>
          <p className="mb-6 max-w-md text-center text-sm text-muted-foreground leading-relaxed">
            {vertical.welcomeMessage}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 w-full">
            {vertical.examplePrompts.map((prompt) => (
              <Button
                key={prompt}
                variant="outline"
                className="rounded-full text-xs max-w-full"
                onClick={() => handleAction(prompt)}
                disabled={loading || !apiKey}
              >
                <span className="truncate">{prompt}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {(itemCount > 0 || (isUnifiedSelectionVertical && pendingCount > 0)) && (
        <div className="pointer-events-none absolute bottom-[6.9rem] left-4 right-4 z-50">
          <div className="flex items-center justify-end gap-4">
            {isUnifiedSelectionVertical && pendingCount > 0 && (
              <Button
                onClick={handleUnifiedAddToCart}
                className="pointer-events-auto h-12 whitespace-nowrap rounded-full border-2 border-orange-400 bg-[#4a3527] px-4 has-[>svg]:px-4 text-sm font-semibold text-white shadow-[0_8px_16px_-12px_rgba(249,115,22,0.11)] hover:bg-[#553d2d]"
              >
                <ShoppingCart className="h-5 w-5" />
                Add {pendingCount} {pendingCount === 1 ? "item" : "items"} to cart
              </Button>
            )}
            {itemCount > 0 && (
              <CartFloatingButton
                count={itemCount}
                onClick={() => setIsOpen(true)}
                className="pointer-events-auto z-50 h-12 w-12"
              />
            )}
          </div>
        </div>
      )}

      {/* Cart bottom sheet */}
      <Sheet open={isOpen && !!cart} onOpenChange={setIsOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          overlayClassName="backdrop-blur-[3px]"
          onCloseAutoFocus={(event) => event.preventDefault()}
          className="p-0 min-h-0 h-auto max-h-[calc(100%-var(--safe-top,0px)-1.5rem)] pb-[calc(var(--safe-bottom,0px)+0.5rem)]"
        >
          {cart && (
            <CartPanel
              cart={cart}
              onClose={() => setIsOpen(false)}
              onAction={handleAction}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Input — absolutely positioned, overlays messages with gradient */}
      <ChatInput
        onSend={handleAction}
        disabled={loading || !apiKey}
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
