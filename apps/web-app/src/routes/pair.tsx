import { useState } from "react";
import type { FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";

export function PairDevicePage() {
  const [code, setCode] = useState("");
  const [name, setName] = useState(`${navigator.platform || "Web"} browser`);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pairDevice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/lan/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name: name.trim(),
        }),
      });
      const result = (await response.json()) as {
        token?: string;
        message?: string;
      };
      if (!response.ok || !result.token) {
        setError(
          result.message ??
            "Could not pair this device. Check the code and try again.",
        );
        return;
      }
      window.localStorage.setItem("cloudy-lan-token", result.token);
      window.location.assign("/");
    } catch {
      setError(
        "Could not reach Cloudy. Make sure Cloudy is reachable on your network or Tailscale.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center p-5">
      <form onSubmit={pairDevice} className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold">Pair this device</h1>
          <p className="text-sm text-muted-foreground">
            Enter the one-time PIN from the Cloudy host.
          </p>
        </div>
        <div className="space-y-2">
          <label htmlFor="device-name" className="text-sm font-medium">
            Device name
          </label>
          <Input
            id="device-name"
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. My iPhone"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="pair-code" className="text-sm font-medium">
            Pairing code
          </label>
          <Input
            id="pair-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="text-center text-xl tracking-[0.3em]"
            autoFocus
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button
          type="submit"
          className="w-full"
          disabled={code.length !== 6 || !name.trim() || submitting}
        >
          {submitting ? "Pairing…" : "Pair device"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          This browser will be remembered until its access is revoked in Cloudy
          settings.
        </p>
      </form>
    </main>
  );
}

export const Route = createFileRoute("/pair")({ component: PairDevicePage });
