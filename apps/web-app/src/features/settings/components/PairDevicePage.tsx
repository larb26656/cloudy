import { useState } from "react";
import type { FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@repo/ui/components/input-otp";
import { cloudyClient } from "@/lib/api";

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
      const response = await cloudyClient.api.lan.pair.$post({
        json: {
          code,
          name: name.trim(),
        },
      });
      const result = await response.json();
      if (!response.ok || !("token" in result)) {
        setError(
          "message" in result
            ? result.message
            : "Could not pair this device. Check the code and try again.",
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
      <form
        onSubmit={pairDevice}
        className="flex w-full max-w-sm flex-col gap-6"
      >
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="text-2xl font-semibold">Pair this device</h1>
          <p className="text-sm text-muted-foreground">
            Enter the one-time PIN from the Cloudy host.
          </p>
        </div>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="device-name">Device name</FieldLabel>
            <Input
              id="device-name"
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. My iPhone"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="pair-code">Pairing code</FieldLabel>
            <InputOTP
              id="pair-code"
              maxLength={6}
              pattern="^[0-9]+$"
              value={code}
              onChange={setCode}
              containerClassName="w-full justify-center"
              autoFocus
            >
              <InputOTPGroup>
                {Array.from({ length: 6 }, (_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="size-11 text-xl"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </Field>
        </FieldGroup>
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
