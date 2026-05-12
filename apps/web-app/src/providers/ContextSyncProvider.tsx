import { useEffect } from "react";
import { useContextStore } from "@/stores/contextStore";
import { isElectron } from "@/main";

export function ContextSyncProvider({ children }: { children: React.ReactNode }) {
  const setContexts = useContextStore((s) => s.setContexts);

  useEffect(() => {
    if (!isElectron || !window.electronAPI) return;

    window.electronAPI.context.listContexts().then((list) => {
      if (list) setContexts(list);
    });

    const unsub = window.electronAPI.context.onContextUpdate((event) => {
      setContexts(event.contexts);
    });

    return unsub;
  }, [setContexts]);

  return <>{children}</>;
}