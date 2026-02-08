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

function ChatViewInner({
  vertical,
  apiKey,
  swiggyToken,
}: {
  vertical: VerticalConfig;
  apiKey: string | null;
  swiggyToken: string | null;
}) {
  const { messages, loading, error, sendMessage } = useChat(
    vertical,
    apiKey,
    swiggyToken,
  );
  const { cart, isOpen, setIsOpen, itemCount } = useCart(messages, vertical.id);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col relative">
      {/* Messages or empty state */}
      {hasMessages ? (
        <ErrorBoundary>
          <MessageList
            messages={messages}
            loading={loading}
            accentColor={vertical.color}
            verticalId={vertical.id}
            onAction={sendMessage}
          />
        </ErrorBoundary>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `var(--color-${vertical.color})15` }}
          >
            <Bot
              className="h-7 w-7"
              style={{ color: `var(--color-${vertical.color})` }}
            />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            {vertical.name}
          </h2>
          <p className="mb-6 max-w-md text-center text-sm text-gray-500 leading-relaxed">
            {vertical.welcomeMessage}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {vertical.examplePrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                disabled={loading || !apiKey}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cart FAB */}
      {itemCount > 0 && (
        <CartFloatingButton
          count={itemCount}
          onClick={() => setIsOpen(true)}
          accentColor={vertical.color}
        />
      )}

      {/* Cart drawer */}
      {isOpen && cart && (
        <CartPanel
          cart={cart}
          onClose={() => setIsOpen(false)}
          onAction={sendMessage}
          accentColor={vertical.color}
        />
      )}

      {/* Error display */}
      {error && (
        <div className="mx-auto w-full max-w-3xl px-4 pb-2">
          <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600" role="alert">
            {error}
          </div>
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        disabled={loading || !apiKey}
        accentColor={vertical.color}
      />
    </div>
  );
}

export function ChatView(props: {
  apiKey: string | null;
  swiggyToken: string | null;
}) {
  const { verticalId } = useParams<{ verticalId: string }>();
  const vertical = verticalId ? verticals[verticalId] : undefined;

  if (!vertical) return <Navigate to="/" replace />;

  // Key on verticalId so the inner component remounts with fresh hook state
  return <ChatViewInner key={verticalId} vertical={vertical} {...props} />;
}
