import { useEffect, useState } from "react";
import { isModeElectron } from "@/main";
import { Spinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { useServerSettingsStore } from "@/stores/serverSettingsStore";
import FullScreenCenter from "@/components/layout/FullScreenCenter";

const CONFIG_PATH = "~/.config/cloudy/desktop.json";

const loadConfig = async () => {
  try {
    const config = await window.electronAPI?.config.load();
    return config;
  } catch (err) {
    // add caurse
    throw new Error("Fail to load config");
  }
};

const pingServer = async (endpoint: string) => {
  try {
    const res = await fetch(`${endpoint}/api/health`);
    if (!res.ok) throw new Error("Server responded with non-OK status");
  } catch {
    throw new Error(
      `Cannot connect to Cloudy server. Please check your configuration at ${CONFIG_PATH}`,
    );
  }
};

// TODO refactor this later
const getEndpoint = (server: {
  mode: "local" | "remote";
  local: {
    host: string;
    port: number;
  };
  remote: {
    endpoint: string;
  };
}) => {
  const { mode, local, remote } = server; // ใช้ get() ดึง state ล่าสุด
  if (mode === "local") {
    return `http://${local.host}:${local.port}`; // ปรับไส้ในตามโครงสร้างโลคอลของคุณ
  }
  return remote.endpoint;
};

export function ServerSettingsSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setMode = useServerSettingsStore((s) => s.setMode);
  const setLocalConfig = useServerSettingsStore((s) => s.setLocalConfig);
  const setRemoteEndpoint = useServerSettingsStore((s) => s.setRemoteEndpoint);

  useEffect(() => {
    // Define the async logic inside
    const initializeConfig = async () => {
      if (!isModeElectron || !window.electronAPI) {
        setIsLoading(false);
        return;
      }

      try {
        const config = await loadConfig();
        const server = config!.server;
        const endpoint = getEndpoint(server);
        await pingServer(endpoint);

        setMode(server.mode);
        setLocalConfig(server.local);
        setRemoteEndpoint(server.remote.endpoint);
      } catch (err: any) {
        setError(err?.message);
      } finally {
        // Good practice to toggle loading in finally
        setIsLoading(false);
      }
    };

    // Execute it
    initializeConfig();
  }, []);

  if (isLoading) {
    return (
      <FullScreenCenter>
        <Spinner />
      </FullScreenCenter>
    );
  }

  if (error) {
    return (
      <FullScreenCenter>
        <ErrorState message={error} onRetry={() => location.reload()} />
      </FullScreenCenter>
    );
  }

  return <>{children}</>;
}
