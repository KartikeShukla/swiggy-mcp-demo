import { useState, useCallback, useMemo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { PhoneFrameContext } from "./phone-frame-context";
import { verticals } from "@/verticals";

const glowColors: Record<string, string> = {
  food: "rgba(34, 197, 94, 0.09)",
  style: "rgba(139, 92, 246, 0.09)",
  dining: "rgba(245, 158, 11, 0.09)",
  foodorder: "rgba(239, 68, 68, 0.09)",
};

const defaultGlow = "rgba(249, 115, 22, 0.06)";

export function PhoneFrame({ children }: { children: ReactNode }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const ref = useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
  }, []);

  const location = useLocation();
  const verticalId = location.pathname.replace(/^\//, "").split("/")[0];
  const glowColor = useMemo(
    () => glowColors[verticalId] ?? defaultGlow,
    [verticalId],
  );
  const activeVertical = verticals[verticalId];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-stone-200 via-stone-100 to-stone-200 dark:from-stone-900 dark:via-stone-950 dark:to-stone-900">
      <div
        className="absolute inset-0 transition-all duration-700 ease-in-out"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${glowColor} 0%, transparent 70%)`,
        }}
      />
      <div className="relative z-10 flex items-center gap-10">
        <div
          ref={ref}
          className="relative w-[390px] h-[844px] max-h-[95vh] rounded-[3rem] border-[8px] shadow-2xl overflow-hidden bg-background flex flex-col"
          style={{ transform: "scale(1)", "--safe-top": "50px", "--safe-bottom": "34px", borderColor: "#2c2c2e" } as React.CSSProperties}
        >
          {/* Dynamic Island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[60] w-[120px] h-[34px] bg-black rounded-full pointer-events-none" />

          {/* Content */}
          <PhoneFrameContext.Provider value={container}>
            {container && children}
          </PhoneFrameContext.Provider>

          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[60] w-[134px] h-[5px] bg-foreground/20 rounded-full pointer-events-none" />
        </div>

        {activeVertical && (
          <aside
            key={activeVertical.id}
            className="hidden max-w-[320px] lg:block animate-[fade-in_300ms_ease-out]"
            style={{
              fontFamily:
                "\"Geist Sans Variable\", \"Geist Sans\", system-ui, -apple-system, sans-serif",
            }}
          >
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              {activeVertical.name}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              {activeVertical.description}
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}
