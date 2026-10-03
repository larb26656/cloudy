import { PlugZap, RotateCw, Server } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "@repo/ui/components/sonner";
import { Button } from "@repo/ui/components/button";
import { ErrorState } from "@repo/ui/components/error-state";
import { Input } from "@repo/ui/components/input";
import { LoadingState } from "@repo/ui/components/loading-state";
import { Switch } from "@repo/ui/components/switch";
import {
  useProviderSettings,
  useUpdateProviderSettings,
} from "@/hooks/queries/useProviderSettings";

export function ProviderSettings() {
  const { data, isPending, error, refetch } = useProviderSettings();
  const update = useUpdateProviderSettings();
  const [enabled, setEnabled] = useState(true);
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    if (!data) return;
    setEnabled(data.opencode.enabled);
    setBaseUrl(data.opencode.baseUrl);
  }, [data]);

  if (isPending) return <LoadingState className="py-12" />;
  if (error)
    return (
      <ErrorState
        message={error.message}
        onRetry={() => void refetch()}
        className="py-12"
      />
    );

  const isDirty =
    data !== undefined &&
    (enabled !== data.opencode.enabled || baseUrl !== data.opencode.baseUrl);

  const save = () => {
    let normalizedBaseUrl: string;
    try {
      normalizedBaseUrl = new URL(baseUrl).toString().replace(/\/$/, "");
    } catch {
      toast.error("Enter a valid server URL, including http:// or https://");
      return;
    }

    update.mutate(
      { opencode: { enabled, baseUrl: normalizedBaseUrl } },
      {
        onSuccess: () => {
          toast.success(
            "Provider settings saved. Restart Cloudy to apply them.",
          );
        },
        onError: (saveError: Error) => toast.error(saveError.message),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Providers</h2>
        <p className="text-sm text-muted-foreground">
          Connections are configured independently and saved on this Cloudy
          server.
        </p>
      </div>

      <section className="space-y-5 rounded-lg border p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
              <PlugZap className="size-4" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-medium">OpenCode</h3>
              <p className="text-xs text-muted-foreground">
                Runs chat sessions, models, and agents through an OpenCode
                server.
              </p>
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            aria-label="Enable OpenCode provider"
          />
        </div>

        <div className="space-y-2 border-t pt-5">
          <label htmlFor="opencode-base-url" className="text-sm font-medium">
            Server URL
          </label>
          <div className="flex items-center gap-2">
            <Server className="size-4 shrink-0 text-muted-foreground" />
            <Input
              id="opencode-base-url"
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder="http://localhost:4096"
              inputMode="url"
              disabled={!enabled || update.isPending}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Restart Cloudy after saving to reconnect with this provider profile.
          </p>
        </div>
      </section>

      <div className="flex justify-end border-t pt-4">
        <Button onClick={save} disabled={!isDirty || update.isPending}>
          {update.isPending && <RotateCw className="animate-spin" />}
          Save provider settings
        </Button>
      </div>
    </div>
  );
}
