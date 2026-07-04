import { useState, useEffect, useCallback, useMemo } from "react";
import { debounce } from "lodash-es";

import { SettingsChildLayout } from "../SettingsChildLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { isModeElectron } from "@/main";
import { useServerSettingsStore } from "@/stores/serverSettingsStore";

export function ServerSection() {
  const { mode, local, remote, setMode, setLocalConfig, setRemoteEndpoint } =
    useServerSettingsStore();

  const [serverStatus, setServerStatus] = useState<{
    running: boolean;
    url?: string;
  }>({ running: false });

  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (!isModeElectron) {
      setIsHydrated(true);
      return;
    }

    const hydrate = async () => {
      try {
        const config = await window.electronAPI?.config.load();
        if (config) {
          setMode(config.server.mode);
          setLocalConfig(config.server.local);
          setRemoteEndpoint(config.server.remote.endpoint);
        }
        const status = await window.electronAPI?.server.status();
        if (status?.status) {
          setServerStatus(status.status);
        }
      } catch (error) {
        console.error("Failed to hydrate config:", error);
      }
      setIsHydrated(true);
    };

    hydrate();
  }, [setMode, setLocalConfig, setRemoteEndpoint]);

  const saveConfig = useCallback(async () => {
    if (!isModeElectron || !isHydrated) return;
    try {
      await window.electronAPI?.config.save({
        server: {
          mode,
          local,
          remote,
        },
      });
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  }, [isModeElectron, isHydrated, mode, local, remote]);

  const debouncedSaveConfig = useMemo(
    () => debounce(saveConfig, 500),
    [saveConfig]
  );

  const handleModeChange = async (newMode: "local" | "remote") => {
    if (newMode === "remote" && serverStatus.running) {
      await window.electronAPI?.server.stop();
      setServerStatus({ running: false });
    }
    setMode(newMode);
    debouncedSaveConfig();
  };

  const handleLocalConfigChange = (changes: Partial<typeof local>) => {
    setLocalConfig(changes);
    debouncedSaveConfig();
  };

  const handleRemoteEndpointChange = (endpoint: string) => {
    setRemoteEndpoint(endpoint);
    debouncedSaveConfig();
  };

  const handleStartServer = async () => {
    if (!isModeElectron) return;

    setIsLoading(true);
    try {
      const result = await window.electronAPI?.server.start({
        host: local.host,
        port: local.port,
      });

      if (result?.status) {
        setServerStatus(result.status);
      } else if (result?.error) {
        console.error("Server start error:", result.error);
      }
    } catch (error) {
      console.error("Failed to start server:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopServer = async () => {
    if (!isModeElectron) return;

    setIsLoading(true);
    try {
      const result = await window.electronAPI?.server.stop();
      if (result?.status) {
        setServerStatus(result.status);
      }
    } catch (error) {
      console.error("Failed to stop server:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isHydrated) {
    return (
      <SettingsChildLayout title="Server">
        <div className="flex items-center justify-center p-8">
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </SettingsChildLayout>
    );
  }

  return (
    <SettingsChildLayout title="Server">
      <div className="space-y-6">
        {isModeElectron && (
          <Card>
            <CardHeader>
              <CardTitle>Server Mode</CardTitle>
              <CardDescription>
                Choose how to connect to the Cloudy server
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Local Server</Label>
                  <p className="text-sm text-muted-foreground">
                    Run Cloudy server embedded in this app
                  </p>
                </div>
                <Switch
                  checked={mode === "local"}
                  onCheckedChange={(checked) =>
                    handleModeChange(checked ? "local" : "remote")
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}

        {mode === "local" ? (
          <Card>
            <CardHeader>
              <CardTitle>Local Server</CardTitle>
              <CardDescription>
                Configure the embedded Cloudy server
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="host">Host</Label>
                  <Input
                    id="host"
                    value={local.host}
                    onChange={(e) =>
                      handleLocalConfigChange({ host: e.target.value })
                    }
                    placeholder="localhost"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    type="number"
                    value={local.port}
                    onChange={(e) =>
                      handleLocalConfigChange({
                        port: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="3000"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                {serverStatus.running ? (
                  <>
                    <Button
                      variant="destructive"
                      onClick={handleStopServer}
                      disabled={isLoading}
                    >
                      {isLoading ? "Stopping..." : "Stop Server"}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Running at {serverStatus.url}
                    </span>
                  </>
                ) : (
                  <Button onClick={handleStartServer} disabled={isLoading}>
                    {isLoading ? "Starting..." : "Start Server"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Remote Server</CardTitle>
              <CardDescription>
                Connect to a Cloudy server hosted elsewhere
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="endpoint">Server Endpoint</Label>
                <Input
                  id="endpoint"
                  value={remote.endpoint}
                  onChange={(e) => handleRemoteEndpointChange(e.target.value)}
                  placeholder="https://your-cloudy-server.com"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SettingsChildLayout>
  );
}
