import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";
import { LoadingIndicator } from "./LoadingIndicator";
import { ScrollArea } from "@/components/ui/scroll-area";

export function MessageList({
  messages,
  loading,
  verticalId,
  onAction,
}: {
  messages: ChatMessage[];
  loading: boolean;
  verticalId?: string;
  onAction?: (message: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <ScrollArea type="always" className="flex-1 min-h-0" role="log" aria-live="polite">
      <div
        data-testid="message-list-content"
        className="pr-2"
        style={{ paddingBottom: "calc(var(--safe-bottom) + 8rem)" }}
      >
        {messages.map((msg, i) => {
          const prevRole = i > 0 ? messages[i - 1].role : msg.role;
          const roleChanged = prevRole !== msg.role;
          return (
            <div key={i} className={i === 0 ? "" : roleChanged ? "mt-4" : "mt-1"}>
              <MessageBubble
                message={msg}
                verticalId={verticalId}
                onAction={onAction}
              />
            </div>
          );
        })}
        {loading && <LoadingIndicator />}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
