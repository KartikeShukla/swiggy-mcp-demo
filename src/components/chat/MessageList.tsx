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
    <ScrollArea className="flex-1 min-h-0 py-4" role="log" aria-live="polite">
      <div className="space-y-1 overflow-x-hidden">
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            message={msg}
            verticalId={verticalId}
            onAction={onAction}
          />
        ))}
        {loading && <LoadingIndicator />}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
