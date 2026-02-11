import { memo } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import type { ParsedStatus } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";

export const StatusCard = memo(function StatusCard({
  status,
}: {
  status: ParsedStatus;
}) {
  const isSuccess = status.success;
  const Icon = isSuccess ? CheckCircle : XCircle;

  return (
    <Card
      className={`rounded-2xl py-0 gap-0 ${
        isSuccess
          ? "border border-primary/40 bg-primary/5"
          : "border border-destructive/40 bg-destructive/5"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isSuccess ? "bg-primary/15" : "bg-destructive/15"
            }`}
          >
            <Icon
              className={`h-5 w-5 ${isSuccess ? "text-primary" : "text-destructive"}`}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground text-left">
              {status.message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
