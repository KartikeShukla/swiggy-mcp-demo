import type { ChatAction, ChatMessage } from "@/lib/types";
import { AssistantMessageBubble } from "./AssistantMessageBubble";
import { UserMessageBubble } from "./UserMessageBubble";

export function MessageBubble({
  message,
  onAction,
  verticalId,
}: {
  message: ChatMessage;
  onAction?: (action: ChatAction) => void;
  verticalId?: string;
}) {
  if (message.role === "user") {
    return <UserMessageBubble message={message} />;
  }

  return (
    <AssistantMessageBubble
      message={message}
      onAction={onAction}
      verticalId={verticalId}
    />
  );
}
