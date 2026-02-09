import { useParams, Navigate } from "react-router-dom";
import { verticals } from "@/verticals";
import type { VerticalConfig } from "@/lib/types";
import { useChat } from "@/hooks/useChat";
import { useCart } from "@/hooks/useCart";
import { ErrorBoundary } from "../ErrorBoundary";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { CartFloatingButton } from "../cart/CartFloatingButton";
import { CartPanel } from "../cart/CartPanel";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

function ChatViewInner({
  vertical,
  apiKey,
  swiggyToken,
  onAuthError,
}: {
  vertical: VerticalConfig;
  apiKey: string | null;
  swiggyToken: string | null;
  onAuthError?: () => void;
}) {
  const { messages, loading, error, sendMessage } = useChat(
    vertical,
    apiKey,
    swiggyToken,
    onAuthError,
  );
  const { cart, isOpen, setIsOpen, itemCount } = useCart(messages, vertical.id);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full flex-col relative">
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
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Bot className="h-7 w-7 text-primary" />
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

      {/* Error display */}
      {error && (
        <div className="mx-auto w-full max-w-3xl px-4 pb-2">
          <div className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive" role="alert">
            {error}
          </div>
        </div>
      )}

      {/* Input */}
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
}) {
  const { verticalId } = useParams<{ verticalId: string }>();
  const vertical = verticalId ? verticals[verticalId] : undefined;

  if (!vertical) return <Navigate to="/" replace />;

  // Key on verticalId so the inner component remounts with fresh hook state
  return <ChatViewInner key={verticalId} vertical={vertical} {...props} />;
}
