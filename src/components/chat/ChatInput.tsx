import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEXTAREA_MAX_HEIGHT } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
    }
  }, [text]);

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="shrink-0 z-40 bg-gradient-to-t from-background from-60% to-transparent pb-[var(--safe-bottom)] pt-8 px-4">
      <div className="mx-auto">
        <div
          className={cn(
            "flex items-end gap-2 rounded-2xl border border-border bg-card px-4 py-2 shadow-sm",
            "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50",
          )}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            aria-label="Ask anything"
            rows={1}
            disabled={disabled}
            className="flex-1 resize-none border-0 bg-transparent py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50"
          />
          <Button
            onClick={handleSubmit}
            disabled={disabled || !text.trim()}
            aria-label="Send message"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-xl"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
