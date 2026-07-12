import { resolveUrl } from "@/lib/url";

const FALLBACK_API_URL =
  resolveUrl(import.meta.env.VITE_API_URL) || window.origin;
const FALLBACK_OPENCODE_API_URL =
  resolveUrl(import.meta.env.VITE_OPENCODE_URL) || window.origin + "/api/oc";

export const isModeElectron = false;
export const isElectronProd = false;

function getApiUrl(): string {
  return FALLBACK_API_URL;
}

function getOpencodeApiUrl(): string {
  return FALLBACK_OPENCODE_API_URL;
}

export const env = {
  API_URL: FALLBACK_API_URL,
  OPENCODE_API_URL: FALLBACK_OPENCODE_API_URL,
  getApiUrl,
  getOpencodeApiUrl,
};
