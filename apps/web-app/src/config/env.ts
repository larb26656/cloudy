import { resolveUrl } from "@/lib/url";

const desktopInfo =
  typeof window === "undefined" ? undefined : window.__CLOUDY_DESKTOP__;

export const isModeElectron = desktopInfo !== undefined;
export const isElectronProd = desktopInfo !== undefined && !desktopInfo.isDev;

const FALLBACK_API_URL =
  desktopInfo?.apiUrl ??
  (resolveUrl(import.meta.env.VITE_API_URL) || window.origin);

function getApiUrl(): string {
  return FALLBACK_API_URL;
}

export const env = {
  API_URL: FALLBACK_API_URL,
  getApiUrl,
};
