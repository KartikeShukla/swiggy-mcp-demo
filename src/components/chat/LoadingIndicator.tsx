export function LoadingIndicator({
  label = "Thinking...",
}: {
  label?: string | null;
  elapsedMs?: number;
}) {
  return (
    <div className="flex items-center px-4 py-3" role="status" aria-label="Loading response">
      <div className="relative w-fit overflow-hidden rounded-full bg-muted/85 px-3.5 py-2 shadow-sm ring-1 ring-border/60">
        {/* shimmer sweep */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            animation: "shimmer-sweep 2.4s ease-in-out infinite",
            background:
              "linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 60%, transparent 100%)",
          }}
        />
        <div className="relative flex items-center gap-2">
          <div className="flex items-center gap-[3px]">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[5px] w-[5px] rounded-full bg-primary/70"
                style={{
                  animation: `loading-dot 1.4s ease-in-out ${i * 0.18}s infinite`,
                }}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-foreground/90">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
