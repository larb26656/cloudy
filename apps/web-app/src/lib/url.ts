export function resolveUrl(url?: string, fallback?: string): string {
  const value = url || fallback || "";

  if (/^https?:\/\//.test(value)) return value;

  if (value.startsWith("/")) {
    return window.origin + value;
  }

  return value;
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
