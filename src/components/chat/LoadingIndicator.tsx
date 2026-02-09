export function LoadingIndicator() {
  return (
    <div className="flex items-center px-4 py-3" role="status" aria-label="Loading response">
      <div className="flex items-center gap-1.5 rounded-full bg-muted px-4 py-2">
        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/50" />
        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/50 [animation-delay:150ms]" />
        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/50 [animation-delay:300ms]" />
      </div>
    </div>
  );
}
