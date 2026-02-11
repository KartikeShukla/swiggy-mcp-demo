import { memo } from "react";
import { Info } from "lucide-react";
import type { ParsedInfoEntry } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const InfoCard = memo(function InfoCard({
  title,
  entries,
}: {
  title: string;
  entries: ParsedInfoEntry[];
}) {
  return (
    <Card className="rounded-2xl py-0 gap-0">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          <h4 className="min-w-0 truncate text-sm font-semibold text-card-foreground">{title}</h4>
        </div>
        <Separator className="mb-3 bg-border/60" />
        <dl className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.key} className="flex gap-2 text-xs">
              <dt className="shrink-0 text-[11px] font-medium text-muted-foreground">
                {entry.key}:
              </dt>
              <dd className="min-w-0 break-words text-card-foreground">{entry.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
});
