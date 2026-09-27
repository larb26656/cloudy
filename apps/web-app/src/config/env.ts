import { resolveUrl } from "@/lib/url";

const FALLBACK_API_URL =
  resolveUrl(import.meta.env.VITE_API_URL) || window.origin;

export const isModeElectron = false;
export const isElectronProd = false;

function getApiUrl(): string {
  return FALLBACK_API_URL;
}

export const env = {
  API_URL: FALLBACK_API_URL,
  getApiUrl,
};
