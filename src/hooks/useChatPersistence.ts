import { useState, useEffect } from "react";
import { getChatHistory, setChatHistory } from "@/lib/storage";
import type { ChatMessage } from "@/lib/types";

/** Manages chat message state with localStorage persistence per vertical. */
export function useChatPersistence(verticalId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    getChatHistory(verticalId),
  );

  // Reload history when vertical changes
  useEffect(() => {
    setMessages(getChatHistory(verticalId));
  }, [verticalId]);

  // Persist on change
  useEffect(() => {
    setChatHistory(verticalId, messages);
  }, [messages, verticalId]);

  return { messages, setMessages };
}
