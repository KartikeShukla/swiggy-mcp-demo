export function LoadingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3" role="status" aria-label="Loading response">
      <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400" />
      <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400 [animation-delay:150ms]" />
      <div className="h-2 w-2 animate-pulse rounded-full bg-gray-400 [animation-delay:300ms]" />
    </div>
  );
}
