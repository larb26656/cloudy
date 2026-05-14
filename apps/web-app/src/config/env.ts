import { resolveUrl } from "@/lib/url";
import { useServerSettingsStore } from "@/features/settings/store/serverSettingsStore";
import { isModeElectron } from "@/main";

const FALLBACK_API_URL = resolveUrl(import.meta.env.VITE_API_URL) || window.origin + "/api";
const FALLBACK_OPENCODE_API_URL = resolveUrl(import.meta.env.VITE_OPENCODE_URL) || window.origin + "/api/oc";

function getApiUrl(): string {
  if (!isModeElectron) {
    return FALLBACK_API_URL;
  }

  const { mode, local, remote } = useServerSettingsStore.getState();

  if (mode === "local") {
    return `http://${local.host}:${local.port}/`;
  }

  return resolveUrl(remote.endpoint);
}

function getOpencodeApiUrl(): string {
  if (!isModeElectron) {
    return FALLBACK_OPENCODE_API_URL;
  }

  const { mode, local, remote } = useServerSettingsStore.getState();

  if (mode === "local") {
    return `http://${local.host}:${local.port}/oc`;
  }

  return resolveUrl(remote.endpoint);
}

export const env = {
  API_URL: FALLBACK_API_URL,
  OPENCODE_API_URL: FALLBACK_OPENCODE_API_URL,
  getApiUrl,
  getOpencodeApiUrl,
};