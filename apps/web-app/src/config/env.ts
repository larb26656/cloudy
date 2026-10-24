import { resolveUrl } from "@/lib/url";

const desktopInfo =
  typeof window === "undefined" ? undefined : window.__CLOUDY_DESKTOP__;
const browserWindow = typeof window === "undefined" ? undefined : window;

export const isModeElectron = desktopInfo !== undefined;
export const isElectronProd = desktopInfo !== undefined && !desktopInfo.isDev;

const isLoopbackHost = browserWindow
  ? ["localhost", "127.0.0.1", "[::1]"].includes(
      browserWindow.location.hostname,
    )
  : false;
const configuredApiUrl = resolveUrl(import.meta.env.VITE_API_URL);
const FALLBACK_API_URL =
  desktopInfo?.apiUrl ??
  (browserWindow
    ? isLoopbackHost
      ? configuredApiUrl || browserWindow.origin
      : browserWindow.origin
    : configuredApiUrl);

function getApiUrl(): string {
  return FALLBACK_API_URL;
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("cloudy-lan-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const env = {
  API_URL: FALLBACK_API_URL,
  getApiUrl,
  getAuthHeaders,
};
