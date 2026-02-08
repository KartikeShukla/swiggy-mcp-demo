import { CheckCircle, XCircle } from "lucide-react";
import type { ParsedStatus } from "@/lib/types";

export function StatusCard({
  status,
  accentColor,
}: {
  status: ParsedStatus;
  accentColor: string;
}) {
  const isSuccess = status.success;
  const borderColor = isSuccess ? `var(--color-${accentColor})` : "#ef4444";
  const bgColor = isSuccess ? `var(--color-${accentColor})10` : "#fef2f210";
  const iconColor = isSuccess ? `var(--color-${accentColor})` : "#ef4444";
  const Icon = isSuccess ? CheckCircle : XCircle;

  const detailEntries = status.details
    ? Object.entries(status.details).slice(0, 4)
    : [];

  return (
    <div
      className="rounded-xl border-2 p-4"
      style={{ borderColor, backgroundColor: bgColor }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${iconColor}20` }}
        >
          <Icon className="h-5 w-5" style={{ color: iconColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">
            {status.message}
          </p>
          {detailEntries.length > 0 && (
            <dl className="mt-2 space-y-1">
              {detailEntries.map(([key, value]) => (
                <div key={key} className="flex gap-2 text-xs">
                  <dt className="shrink-0 font-medium text-gray-500">
                    {humanizeKey(key)}:
                  </dt>
                  <dd className="text-gray-700">{stringifyValue(value)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

function humanizeKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function stringifyValue(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) return val.map(stringifyValue).join(", ");
  return JSON.stringify(val);
}
