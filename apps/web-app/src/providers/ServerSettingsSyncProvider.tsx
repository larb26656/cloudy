import { useEffect, useState } from "react";
import { useServerSettingsStore } from "@/features/settings/store/serverSettingsStore";
import { isModeElectron } from "@/main";
import { Spinner } from "@/components/ui/spinner";

export function ServerSettingsSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const setMode = useServerSettingsStore((s) => s.setMode);
  const setLocalConfig = useServerSettingsStore((s) => s.setLocalConfig);
  const setRemoteEndpoint = useServerSettingsStore((s) => s.setRemoteEndpoint);

  useEffect(() => {
    if (!isModeElectron || !window.electronAPI) {
      setIsLoading(false);
      return;
    }

    window.electronAPI.config.load().then((config) => {
      if (config?.server) {
        setMode(config.server.mode);
        setLocalConfig(config.server.local);
        setRemoteEndpoint(config.server.remote.endpoint);
      }
      setIsLoading(false);
    });
  }, [setMode, setLocalConfig, setRemoteEndpoint]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}