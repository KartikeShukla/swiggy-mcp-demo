import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ToolSectionCard({
  title,
  icon,
  children,
  className,
  contentClassName,
  bodyClassName,
  titleClassName,
}: {
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  bodyClassName?: string;
  titleClassName?: string;
}) {
  const hasHeader = Boolean(title || icon);

  return (
    <Card className={cn("mb-2 gap-0 rounded-2xl border-border/80 py-0 shadow-sm", className)}>
      <CardContent className={cn("p-4", contentClassName)}>
        {hasHeader && (
          <div className="mb-3 flex items-center gap-2">
            {icon}
            {title ? (
              <h4 className={cn("min-w-0 truncate text-sm font-semibold text-card-foreground", titleClassName)}>
                {title}
              </h4>
            ) : null}
          </div>
        )}
        <div
          className={cn("overflow-x-hidden overflow-y-auto", bodyClassName)}
          style={{ maxHeight: "var(--tool-section-max-h, 420px)" }}
        >
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
