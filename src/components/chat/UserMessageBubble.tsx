import { User } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { renderMarkdownLite } from "@/lib/markdown";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function UserMessageBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="flex flex-col items-end gap-1 px-3 py-2 animate-[fade-in_200ms_ease-out]">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground">You</span>
        <Avatar className="h-5 w-5 shrink-0">
          <AvatarFallback className="bg-muted text-[10px]">
            <User className="h-3 w-3 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="max-w-[88%] rounded-2xl rounded-br-md bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-stone-100 px-4 py-2.5 text-sm leading-relaxed">
        {typeof message.content === "string" ? renderMarkdownLite(message.content) : null}
      </div>
    </div>
  );
}
