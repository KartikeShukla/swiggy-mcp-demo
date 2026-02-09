import { CheckCircle, XCircle } from "lucide-react";
import type { ParsedStatus } from "@/lib/types";
import { MAX_STATUS_CARD_DETAILS } from "@/lib/constants";
import { humanizeKey, stringifyValue } from "@/lib/parsers/format";
import { Card, CardContent } from "@/components/ui/card";

export function StatusCard({
  status,
}: {
  status: ParsedStatus;
}) {
  const isSuccess = status.success;
  const Icon = isSuccess ? CheckCircle : XCircle;

  const detailEntries = status.details
    ? Object.entries(status.details).slice(0, MAX_STATUS_CARD_DETAILS)
    : [];

  return (
    <Card
      className={`rounded-2xl py-0 gap-0 ${
        isSuccess
          ? "border border-primary/40 bg-primary/5"
          : "border border-destructive/40 bg-destructive/5"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isSuccess ? "bg-primary/15" : "bg-destructive/15"
            }`}
          >
            <Icon
              className={`h-5 w-5 ${isSuccess ? "text-primary" : "text-destructive"}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {status.message}
            </p>
            {detailEntries.length > 0 && (
              <dl className="mt-2 space-y-1.5">
                {detailEntries.map(([key, value]) => (
                  <div key={key} className="flex gap-2 text-xs">
                    <dt className="shrink-0 font-medium text-muted-foreground">
                      {humanizeKey(key)}:
                    </dt>
                    <dd className="min-w-0 break-words text-card-foreground">{stringifyValue(value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
