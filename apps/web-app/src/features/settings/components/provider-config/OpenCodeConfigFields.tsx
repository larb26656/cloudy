import { Input } from "@repo/ui/components/input";

export function OpenCodeConfigFields({
  baseUrl,
  onBaseUrlChange,
  label = "Server URL",
}: {
  baseUrl: string;
  onBaseUrlChange: (value: string) => void;
  label?: string;
}) {
  return (
    <Input
      aria-label={label}
      inputMode="url"
      value={baseUrl}
      onChange={(event) => onBaseUrlChange(event.target.value)}
    />
  );
}
