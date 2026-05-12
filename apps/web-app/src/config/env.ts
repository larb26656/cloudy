import { resolveUrl } from "@/lib/url";
import { useServerSettingsStore } from "@/features/settings/store/serverSettingsStore";

function getApiUrl(): string {
  const { mode, local, remote } = useServerSettingsStore.getState();
  
  if (mode === "local") {
    return `http://${local.host}:${local.port}`;
  }
  
  return resolveUrl(remote.endpoint) || window.origin + "/api";
}

export const env = {
  API_URL: resolveUrl(import.meta.env.VITE_API_URL) || window.origin + "/api",
  OPENCODE_API_URL: resolveUrl(import.meta.env.VITE_OPENCODE_URL) || window.origin + "/api/oc",
  getApiUrl,
};