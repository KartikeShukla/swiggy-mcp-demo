import { useState, useEffect } from "react";
import { ExternalLink, Link2, Loader2, X } from "lucide-react";
import type { OnboardingStep } from "@/hooks/useAuth";
import type { ParsedAddress } from "@/lib/types";
import { fetchAddresses } from "@/lib/fetchAddresses";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all",
            i === current ? "w-4 bg-foreground" : "w-1.5 bg-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

function ApiKeyStep({ onSave }: { onSave: (key: string) => void }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed.startsWith("sk-ant-")) {
      setError('API key should start with "sk-ant-"');
      return;
    }
    setError("");
    onSave(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-4">
      <div className="rounded-2xl border border-border/80 bg-card p-4">
        <div className="space-y-2">
          <Label htmlFor="onboarding-api-key">API Key</Label>
          <Input
            id="onboarding-api-key"
            type="password"
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setError("");
            }}
            placeholder="sk-ant-..."
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <Button type="submit" className="mt-4 w-full rounded-full">
          Connect
        </Button>
      </div>

      <a
        href="https://console.anthropic.com/settings/keys"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        Get an API key from Anthropic Console
        <ExternalLink className="h-3 w-3" />
      </a>
    </form>
  );
}

function SwiggyConnectStep({
  onStartOAuth,
}: {
  onStartOAuth: () => void;
}) {
  return (
    <div className="px-4 pb-1 pt-3">
      <div className="rounded-2xl border border-border/80 bg-card p-4">
        <p className="mb-4 text-sm text-muted-foreground">Link your account for live data</p>
        <Button onClick={onStartOAuth} className="w-full rounded-full gap-1.5">
          <Link2 className="h-4 w-4" />
          Connect via OAuth
        </Button>
      </div>
    </div>
  );
}

function AddressSelectStep({
  apiKey,
  swiggyToken,
  onSelect,
}: {
  apiKey: string;
  swiggyToken: string;
  onSelect: (addr: ParsedAddress) => void;
}) {
  const [addresses, setAddresses] = useState<ParsedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAddresses(apiKey, swiggyToken).then((result) => {
      if (!cancelled) {
        setAddresses(result);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [apiKey, swiggyToken]);

  return (
    <div className="px-4 pb-1 pt-3">
      <div className="rounded-2xl border border-border/80 bg-card p-2.5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : addresses.length > 0 ? (
          <div className="max-h-[min(48dvh,26rem)] space-y-2 overflow-y-auto pr-1">
            {addresses.map((addr) => (
              <button
                key={addr.id}
                onClick={() => {
                  setSelectedId(addr.id);
                  onSelect(addr);
                }}
                className="w-full rounded-xl border border-border/70 bg-background px-3 py-3.5 text-left transition-colors hover:bg-muted/40"
              >
                <div className="flex min-h-[3.5rem] items-center gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border/80",
                      selectedId === addr.id && "border-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full bg-primary transition-opacity",
                        selectedId === addr.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </span>
                  <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{addr.address}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No saved addresses found.
          </p>
        )}
      </div>
    </div>
  );
}

const stepIndex: Record<string, number> = {
  "api-key": 0,
  "swiggy-connect": 1,
  "address-select": 2,
};

function OnboardingHeader({
  title,
  showClose,
  onClose,
}: {
  title: string;
  showClose: boolean;
  onClose?: () => void;
}) {
  return (
    <SheetHeader className="px-4 pb-2 pt-5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center">
        <span aria-hidden className="h-8 w-8" />
        <SheetTitle className="text-base text-center">{title}</SheetTitle>
        {showClose ? (
          <button
            type="button"
            onClick={onClose}
            className="ring-offset-background focus-visible:ring-ring justify-self-end inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/90 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </button>
        ) : (
          <span aria-hidden className="h-8 w-8" />
        )}
      </div>
    </SheetHeader>
  );
}

export function OnboardingSheet({
  step,
  apiKey,
  swiggyToken,
  onSaveApiKey,
  onStartOAuth,
  onSelectAddress,
  onDismiss,
}: {
  step: OnboardingStep;
  apiKey: string | null;
  swiggyToken: string | null;
  onSaveApiKey: (key: string) => void;
  onStartOAuth: () => void;
  onSelectAddress: (addr: ParsedAddress) => void;
  onDismiss: () => void;
}) {
  if (step === "idle") return null;
  const showClose = step !== "api-key" || !!apiKey;

  if (step === "api-key") {
    return (
      <Sheet open>
        <SheetContent
          side="bottom"
          aria-describedby={undefined}
          showCloseButton={false}
          className="p-0 min-h-0 h-auto max-h-[88dvh]"
        >
          <OnboardingHeader title="API Key" showClose={showClose} onClose={onDismiss} />
          <StepDots current={stepIndex[step]} />
          <ApiKeyStep onSave={onSaveApiKey} />
          <SheetDescription className="sr-only">Enter your API key to continue setup</SheetDescription>
        </SheetContent>
      </Sheet>
    );
  }

  if (step === "swiggy-connect") {
    return (
      <Sheet open>
        <SheetContent
          side="bottom"
          aria-describedby={undefined}
          showCloseButton={false}
          overlayClassName="backdrop-blur-[3px]"
          onCloseAutoFocus={(event) => event.preventDefault()}
          className="p-0 min-h-0 h-auto max-h-[calc(100%-var(--safe-top,0px)-1.5rem)] pb-[calc(var(--safe-bottom,0px)+0.5rem)]"
        >
          <OnboardingHeader title="Connect Swiggy" showClose={showClose} onClose={onDismiss} />
          <SwiggyConnectStep onStartOAuth={onStartOAuth} />
          <SheetDescription className="sr-only">Connect your Swiggy account to continue setup</SheetDescription>
        </SheetContent>
      </Sheet>
    );
  }

  if (!apiKey || !swiggyToken) return null;

  return (
    <Sheet open>
      <SheetContent
        side="bottom"
        aria-describedby={undefined}
        showCloseButton={false}
        overlayClassName="backdrop-blur-[3px]"
        onCloseAutoFocus={(event) => event.preventDefault()}
        className="p-0 min-h-0 h-auto max-h-[calc(100%-var(--safe-top,0px)-1.5rem)] pb-[calc(var(--safe-bottom,0px)+0.5rem)]"
      >
        <OnboardingHeader title="Select delivery address" showClose={showClose} onClose={onDismiss} />
        <div className="min-h-0 overflow-hidden">
          <AddressSelectStep
            apiKey={apiKey}
            swiggyToken={swiggyToken}
            onSelect={onSelectAddress}
          />
        </div>
        <SheetDescription className="sr-only">Select a delivery address to continue setup</SheetDescription>
      </SheetContent>
    </Sheet>
  );
}
