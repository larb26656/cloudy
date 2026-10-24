import { useEffect, useState } from "react";
import { Copy, ShieldCheck, Wifi } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@repo/ui/components/button";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { Switch } from "@repo/ui/components/switch";
import { isModeElectron } from "@/config/env";

type NetworkState = {
  enabled: boolean;
  devices: { id: string; name: string; createdAt: string }[];
  pairingUrls: { type: "Tailscale" | "LAN" | "Network"; url: string }[];
};

export function NetworkSettings() {
  const [state, setState] = useState<NetworkState | null>(null);
  const [pin, setPin] = useState<{ code: string; expiresAt: number } | null>(
    null,
  );
  const [deviceToRevoke, setDeviceToRevoke] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!isModeElectron) return;
    void window.__CLOUDY_DESKTOP__?.networkBridge?.getState().then(setState);
  }, []);

  useEffect(() => {
    if (!pin) return;
    const timer = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      setPin((current) =>
        current && current.expiresAt <= time ? null : current,
      );
    }, 1000);
    return () => window.clearInterval(timer);
  }, [pin]);

  if (!isModeElectron) {
    return (
      <p className="text-sm text-muted-foreground">
        Network sharing is available in the Cloudy desktop app.
      </p>
    );
  }

  const bridge = window.__CLOUDY_DESKTOP__?.networkBridge;
  const setEnabled = (enabled: boolean) => {
    setState((current) => (current ? { ...current, enabled } : current));
    void bridge?.setEnabled(enabled);
  };

  const createPin = async () => {
    const created = await bridge?.createPin();
    setPin(created ?? null);
    setNow(Date.now());
  };

  const revokeDevice = async (id: string) => {
    if (!(await bridge?.revokeDevice(id))) return;
    setState((current) =>
      current
        ? {
            ...current,
            devices: current.devices.filter((device) => device.id !== id),
          }
        : current,
    );
  };

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Network Access</h2>
        <p className="text-sm text-muted-foreground">
          Connect to Cloudy from another device on your local network or
          Tailscale. In development, access uses the Vite server and proxies API
          requests to the embedded Cloudy server.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-muted">
            <Wifi className="size-4" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Allow network access</p>
            <p className="text-xs text-muted-foreground">
              Requires restarting Cloudy to apply.
            </p>
          </div>
        </div>
        <Switch
          checked={state?.enabled ?? false}
          disabled={!state}
          onCheckedChange={setEnabled}
          aria-label="Allow network access"
        />
      </div>

      {state?.enabled && (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="size-4 text-green-600" />
            Pair devices to protect access
          </div>
          <p className="text-sm text-muted-foreground">
            Create a one-time code, then enter it on another device within 60
            seconds.
          </p>
          {state.pairingUrls.map(({ type, url }) => (
            <div key={url} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-xs text-muted-foreground">
                {type}
              </span>
              <code className="min-w-0 flex-1 break-all rounded-md bg-muted px-3 py-2 text-sm">
                {url}
              </code>
              <Button
                variant="outline"
                size="icon"
                aria-label={`Copy ${type} address`}
                onClick={() => void copy(url, `${type} address`)}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">One-time PIN</p>
              {pin && now < pin.expiresAt ? (
                <>
                  <code className="text-2xl font-semibold tracking-[0.2em]">
                    {pin.code}
                  </code>
                  <p className="text-xs text-muted-foreground">
                    Expires in {Math.ceil((pin.expiresAt - now) / 1000)} seconds
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No active PIN</p>
              )}
            </div>
            {pin && now < pin.expiresAt && (
              <Button
                variant="outline"
                onClick={() => void copy(pin.code, "PIN")}
              >
                <Copy className="mr-2 size-4" /> Copy PIN
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={() => void createPin()}>
            Create / change PIN
          </Button>
          <div className="flex items-center justify-between border-t pt-3">
            <p className="text-xs text-muted-foreground">
              {state.devices.length} paired{" "}
              {state.devices.length === 1 ? "device" : "devices"}
            </p>
          </div>
          {state.devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span>{device.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeviceToRevoke(device)}
              >
                Revoke
              </Button>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={deviceToRevoke !== null}
        onOpenChange={(open) => !open && setDeviceToRevoke(null)}
        title="Revoke device access?"
        description={`“${deviceToRevoke?.name ?? "This device"}” will no longer be able to access Cloudy. This action cannot be undone.`}
        confirmLabel="Revoke access"
        onConfirm={() => {
          if (deviceToRevoke) void revokeDevice(deviceToRevoke.id);
          setDeviceToRevoke(null);
        }}
        destructive
      />
    </div>
  );
}
