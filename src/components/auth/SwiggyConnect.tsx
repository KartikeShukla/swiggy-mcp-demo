import { Badge } from "@/components/ui/badge";

export function StatusChip({
  hasApiKey,
  hasSwiggyToken,
  isTokenStale,
}: {
  hasApiKey: boolean;
  hasSwiggyToken: boolean;
  isTokenStale?: boolean;
}) {
  const active = hasApiKey && hasSwiggyToken && !isTokenStale;

  return (
    <Badge variant="outline" className="gap-1.5">
      <span
        className={`h-2 w-2 rounded-full ${active ? "bg-green-500" : "bg-red-400"}`}
      />
      <span className={active ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
        {active ? "Active" : "Inactive"}
      </span>
    </Badge>
  );
}
