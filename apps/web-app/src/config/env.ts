import { resolveUrl } from "@/lib/url";

export const env = {
    API_URL: resolveUrl(import.meta.env.VITE_API_URL) || window.origin + "/api",
    OPENCODE_API_URL: resolveUrl(import.meta.env.VITE_OPENCODE_URL) || window.origin + "/api/oc",
};