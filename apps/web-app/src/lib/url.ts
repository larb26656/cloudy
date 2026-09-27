export function resolveUrl(url?: string, fallback?: string): string {
  const value = url || fallback || "";

  if (/^https?:\/\//.test(value)) {
    return new URL(value).toString().replace(/\/$/, "");
  }

  if (value.startsWith("/")) {
    return new URL(value.replace(/^\/+/, "/"), window.origin).toString();
  }

  return value;
}

export function joinUrl(base: string, ...paths: string[]): string {
  const path = paths.map((value) => value.replace(/^\/+|\/+$/g, "")).join("/");
  return new URL(path, base.replace(/\/+$/, "") + "/").toString();
}

/**
 * Normalize a user-entered URL: trim, and prepend `https://` when no scheme is
 * present. Empty input is returned as-is. Shared by the webview tab and the
 * webview desk node so behavior stays identical.
 */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return "https://" + trimmed;
}
