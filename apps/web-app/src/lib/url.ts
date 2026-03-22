export function ensureTrailingSlash(url: string): string {
    return url.endsWith("/") ? url : url + "/";
}

export function resolveUrl(url?: string, fallback?: string): string {
    const value = url || fallback || '';

    if (/^https?:\/\//.test(value)) return value;

    if (value.startsWith('/')) {
        return window.origin + value;
    }

    return value;
};
