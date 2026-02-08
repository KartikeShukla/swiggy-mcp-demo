import { Info } from "lucide-react";
import type { ParsedInfoEntry } from "@/lib/types";

export function InfoCard({
  title,
  entries,
  accentColor,
}: {
  title: string;
  entries: ParsedInfoEntry[];
  accentColor: string;
}) {
  return (
    <div
      className="rounded-xl border bg-white p-4 shadow-sm"
      style={{ borderColor: `var(--color-${accentColor})40` }}
    >
      <div className="mb-3 flex items-center gap-2">
        <Info
          className="h-4 w-4"
          style={{ color: `var(--color-${accentColor})` }}
        />
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      </div>
      <dl className="space-y-1.5">
        {entries.map((entry) => (
          <div key={entry.key} className="flex gap-2 text-xs">
            <dt className="shrink-0 font-medium text-gray-500">
              {entry.key}:
            </dt>
            <dd className="break-words text-gray-700">{entry.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
