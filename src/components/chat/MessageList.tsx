import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";
import { LoadingIndicator } from "./LoadingIndicator";

export function MessageList({
  messages,
  loading,
  accentColor,
}: {
  messages: ChatMessage[];
  loading: boolean;
  accentColor: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto py-4">
      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} accentColor={accentColor} />
      ))}
      {loading && <LoadingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
