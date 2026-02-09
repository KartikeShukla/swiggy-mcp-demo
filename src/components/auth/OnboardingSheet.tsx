import { useState, useEffect } from "react";
import { KeyRound, ExternalLink, Link2, ClipboardPaste, MapPin, Loader2 } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

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
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
          <KeyRound className="h-5 w-5 text-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Enter your API key</h3>
          <p className="text-xs text-muted-foreground">Required to connect to Claude</p>
        </div>
      </div>

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

      <Button type="submit" className="w-full">
        Connect
      </Button>

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
  onPasteToken,
}: {
  onStartOAuth: () => void;
  onPasteToken: (token: string) => void;
}) {
  const [token, setToken] = useState("");

  return (
    <div className="space-y-4 px-4 pb-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
          <Link2 className="h-5 w-5 text-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Connect Swiggy</h3>
          <p className="text-xs text-muted-foreground">Link your account for live data</p>
        </div>
      </div>

      <Button onClick={onStartOAuth} className="w-full gap-1.5">
        <Link2 className="h-4 w-4" />
        Connect via OAuth
      </Button>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Separator className="flex-1" />
        or paste token
        <Separator className="flex-1" />
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste access token..."
          className="text-xs"
        />
        <Button
          onClick={() => {
            if (token.trim()) {
              onPasteToken(token.trim());
              setToken("");
            }
          }}
          disabled={!token.trim()}
          size="sm"
          className="gap-1"
        >
          <ClipboardPaste className="h-3 w-3" />
          Save
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
    <div className="space-y-4 px-4 pb-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
          <MapPin className="h-5 w-5 text-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Select delivery address</h3>
          <p className="text-xs text-muted-foreground">Choose your default location</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : addresses.length > 0 ? (
        <div className="space-y-2 max-h-[280px] overflow-y-auto">
          {addresses.map((addr) => (
            <button
              key={addr.id}
              onClick={() => onSelect(addr)}
              className="w-full text-left rounded-xl border border-border px-3 py-3 hover:bg-muted/50 transition-colors"
            >
              <p className="text-xs font-medium text-foreground">{addr.label}</p>
              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{addr.address}</p>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-4">
          No saved addresses found.
        </p>
      )}

      <Button
        variant="ghost"
        className="w-full text-xs text-muted-foreground"
        onClick={() => onSelect({ id: "skip", label: "No address", address: "" })}
      >
        Skip for now
      </Button>
    </div>
  );
}

const stepIndex: Record<string, number> = {
  "api-key": 0,
  "swiggy-connect": 1,
  "address-select": 2,
};

export function OnboardingSheet({
  step,
  apiKey,
  swiggyToken,
  onSaveApiKey,
  onStartOAuth,
  onPasteToken,
  onSelectAddress,
}: {
  step: OnboardingStep;
  apiKey: string | null;
  swiggyToken: string | null;
  onSaveApiKey: (key: string) => void;
  onStartOAuth: () => void;
  onPasteToken: (token: string) => void;
  onSelectAddress: (addr: ParsedAddress) => void;
}) {
  if (step === "idle") return null;

  return (
    <Sheet open>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="rounded-t-2xl"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Setup</SheetTitle>
          <SheetDescription>Complete the setup steps to get started</SheetDescription>
        </SheetHeader>

        <StepDots current={stepIndex[step] ?? 0} />

        {step === "api-key" && <ApiKeyStep onSave={onSaveApiKey} />}
        {step === "swiggy-connect" && (
          <SwiggyConnectStep onStartOAuth={onStartOAuth} onPasteToken={onPasteToken} />
        )}
        {step === "address-select" && apiKey && swiggyToken && (
          <AddressSelectStep
            apiKey={apiKey}
            swiggyToken={swiggyToken}
            onSelect={onSelectAddress}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
