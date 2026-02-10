import type { ChatAction, ChatMessage } from "@/lib/types";
import { AssistantMessageBubble } from "./AssistantMessageBubble";
import { UserMessageBubble } from "./UserMessageBubble";
import type { SharedProductSelection } from "../cards/ProductGrid";

export function MessageBubble({
  message,
  onAction,
  verticalId,
  sharedSelection,
}: {
  message: ChatMessage;
  onAction?: (action: ChatAction) => void;
  verticalId?: string;
  sharedSelection?: SharedProductSelection;
}) {
  if (message.role === "user") {
    return <UserMessageBubble message={message} />;
  }

  return (
    <AssistantMessageBubble
      message={message}
      onAction={onAction}
      verticalId={verticalId}
      sharedSelection={sharedSelection}
    />
  );
}
