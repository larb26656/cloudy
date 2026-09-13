export { formatNumber } from "@repo/ui/lib/format";

export function formatPercentage(value: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export function formatCompact(num: number): string {
  if (num < 1000) return String(num);
  if (num < 1_000_000) return `${(num / 1000).toFixed(1)}K`;
  return `${(num / 1_000_000).toFixed(1)}M`;
}
