import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatAction, ChatMessage } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";
import { LoadingIndicator } from "./LoadingIndicator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SharedProductSelection } from "../cards/ProductGrid";
import { buildToolRenderContext } from "@/lib/relevance/context";

export function MessageList({
  messages,
  loading,
  loadingLabel,
  loadingElapsedMs,
  verticalId,
  lockedRestaurant,
  onAction,
  sharedSelection,
}: {
  messages: ChatMessage[];
  loading: boolean;
  loadingLabel?: string | null;
  loadingElapsedMs?: number;
  verticalId?: string;
  lockedRestaurant?: string | null;
  onAction?: (action: ChatAction) => void;
  sharedSelection?: SharedProductSelection;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [toolSectionMaxHeight, setToolSectionMaxHeight] = useState(420);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateMaxHeight = () => {
      const next = Math.floor(container.clientHeight * 0.75);
      const resolvedNext = next > 0 ? Math.max(240, next) : 420;
      setToolSectionMaxHeight((prev) => (prev === resolvedNext ? prev : resolvedNext));
    };

    updateMaxHeight();
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateMaxHeight);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const latestUserQueryByIndex = useMemo(() => {
    const result: string[] = [];
    let latest = "";
    for (const message of messages) {
      if (message.role === "user" && typeof message.content === "string") {
        latest = message.content;
      }
      result.push(latest);
    }
    return result;
  }, [messages]);

  return (
    <div ref={containerRef} className="flex-1 min-h-0">
      <ScrollArea type="always" className="h-full" role="log" aria-live="polite">
        <div
          data-testid="message-list-content"
          className="pr-2"
          style={{
            paddingTop: "1rem",
            paddingBottom: "calc(var(--safe-bottom) + 8rem)",
            ["--tool-section-max-h" as string]: `${toolSectionMaxHeight}px`,
            ["--tool-section-half-h" as string]: `${Math.floor(toolSectionMaxHeight * (2 / 3))}px`,
          }}
        >
          {messages.map((msg, i) => {
            const prevRole = i > 0 ? messages[i - 1].role : msg.role;
            const roleChanged = prevRole !== msg.role;
            return (
              <div key={i} className={i === 0 ? "" : roleChanged ? "mt-4" : "mt-1"}>
                <MessageBubble
                  message={msg}
                  verticalId={verticalId}
                  renderContext={
                    msg.role === "assistant" && verticalId
                      ? buildToolRenderContext(
                          verticalId,
                          latestUserQueryByIndex[i],
                          lockedRestaurant,
                        )
                      : undefined
                  }
                  onAction={onAction}
                  sharedSelection={sharedSelection}
                />
              </div>
            );
          })}
          {loading && (
            <LoadingIndicator
              label={loadingLabel}
              elapsedMs={loadingElapsedMs}
            />
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
