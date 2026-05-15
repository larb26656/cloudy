import { resolveUrl } from "@/lib/url";
import { isModeElectron } from "@/main";
import { useServerSettingsStore } from "@/stores/serverSettingsStore";

const FALLBACK_API_URL = resolveUrl(import.meta.env.VITE_API_URL) || window.origin + "/api";
const FALLBACK_OPENCODE_API_URL = resolveUrl(import.meta.env.VITE_OPENCODE_URL) || window.origin + "/api/oc";

function getApiUrl(): string {
  if (!isModeElectron) {
    return FALLBACK_API_URL;
  }

  const { getServerUrl } = useServerSettingsStore.getState();
  const serverUrl = getServerUrl();

  return resolveUrl(serverUrl);
}

function getOpencodeApiUrl(): string {
  if (!isModeElectron) {
    return FALLBACK_OPENCODE_API_URL;
  }

  const { getServerUrl } = useServerSettingsStore.getState();
  const serverUrl = getServerUrl();

  return resolveUrl(`${serverUrl}/oc`);
}

export const env = {
  API_URL: FALLBACK_API_URL,
  OPENCODE_API_URL: FALLBACK_OPENCODE_API_URL,
  getApiUrl,
  getOpencodeApiUrl,
};