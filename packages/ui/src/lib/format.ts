export function formatTime(timestamp: number, locale = "en-US"): string {
  return new Date(timestamp).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(num: number, locale = "en-US"): string {
  return num.toLocaleString(locale);
}
