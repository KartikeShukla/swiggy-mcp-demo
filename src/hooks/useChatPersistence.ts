import { useState, useEffect } from "react";
import { getChatHistory, setChatHistory } from "@/lib/storage";
import type { ChatMessage } from "@/lib/types";
import { sanitizeMessagesForApi } from "@/integrations/anthropic/message-sanitizer";

function loadSanitizedHistory(verticalId: string): ChatMessage[] {
  const history = getChatHistory(verticalId);
  const { sanitizedMessages } = sanitizeMessagesForApi(history);
  return sanitizedMessages;
}

/** Manages chat message state with localStorage persistence per vertical. */
export function useChatPersistence(verticalId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadSanitizedHistory(verticalId),
  );

  // Reload history when vertical changes
  useEffect(() => {
    setMessages(loadSanitizedHistory(verticalId));
  }, [verticalId]);

  // Persist on change
  useEffect(() => {
    const { sanitizedMessages } = sanitizeMessagesForApi(messages);
    setChatHistory(verticalId, sanitizedMessages);
  }, [messages, verticalId]);

  return { messages, setMessages };
}
