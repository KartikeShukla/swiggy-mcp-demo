export function formatHeaderDateTime(): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());
}
