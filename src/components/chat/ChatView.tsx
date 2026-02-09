import { useParams, Navigate } from "react-router-dom";
import { verticals } from "@/verticals";
import type { VerticalConfig, ParsedAddress } from "@/lib/types";
import { useChat } from "@/hooks/useChat";
import { useCart } from "@/hooks/useCart";
import { ErrorBoundary } from "../ErrorBoundary";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { CartFloatingButton } from "../cart/CartFloatingButton";
import { CartPanel } from "../cart/CartPanel";
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
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

function ChatViewInner({
  vertical,
  apiKey,
  swiggyToken,
  onAuthError,
  selectedAddress,
}: {
  vertical: VerticalConfig;
  apiKey: string | null;
  swiggyToken: string | null;
  onAuthError?: () => void;
  selectedAddress?: ParsedAddress | null;
}) {
  const { messages, loading, error, sendMessage } = useChat(
    vertical,
    apiKey,
    swiggyToken,
    onAuthError,
    selectedAddress,
  );
  const { cart, isOpen, setIsOpen, itemCount } = useCart(messages, vertical.id);

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
            verticalId={vertical.id}
            onAction={sendMessage}
          />
        </ErrorBoundary>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-3">
          <div className="mb-4 h-[4.5rem] w-[4.5rem] overflow-hidden rounded-2xl">
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
                onClick={() => sendMessage(prompt)}
                disabled={loading || !apiKey}
              >
                <span className="truncate">{prompt}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Cart FAB */}
      {itemCount > 0 && (
        <CartFloatingButton
          count={itemCount}
          onClick={() => setIsOpen(true)}
        />
      )}

      {/* Cart drawer */}
      <Sheet open={isOpen && !!cart} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          {cart && (
            <CartPanel
              cart={cart}
              onClose={() => setIsOpen(false)}
              onAction={sendMessage}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Input — absolutely positioned, overlays messages with gradient */}
      <ChatInput
        onSend={sendMessage}
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
}) {
  const { verticalId } = useParams<{ verticalId: string }>();
  const vertical = verticalId ? verticals[verticalId] : undefined;

  if (!vertical) return <Navigate to="/" replace />;

  // Key on verticalId so the inner component remounts with fresh hook state
  return <ChatViewInner key={verticalId} vertical={vertical} {...props} />;
}
