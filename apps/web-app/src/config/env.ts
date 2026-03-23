import { resolveUrl } from "@/lib/url";

console.log(import.meta.env.VITE_API_URL)
console.log(import.meta.env.VITE_OPENCODE_URL)

export const env = {
    API_URL: resolveUrl(import.meta.env.VITE_API_URL) || window.origin + "/api",
    OPENCODE_API_URL: resolveUrl(import.meta.env.VITE_OPENCODE_URL) || window.origin + "/api/oc",
};