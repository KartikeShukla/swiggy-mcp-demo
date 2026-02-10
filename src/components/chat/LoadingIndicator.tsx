export function LoadingIndicator({
  label = "Thinking...",
}: {
  label?: string | null;
  elapsedMs?: number;
}) {
  return (
    <div className="flex items-center px-4 py-3" role="status" aria-label="Loading response">
      <div className="flex min-w-[12rem] items-center rounded-2xl bg-muted/85 px-3.5 py-2 shadow-sm ring-1 ring-border/60">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-[3.6px]">
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60" />
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:150ms]" />
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:300ms]" />
          </div>
          <span className="text-xs font-medium text-foreground/90">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
