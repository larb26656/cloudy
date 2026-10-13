import { cn } from "@repo/ui/lib/utils";
import { Bot } from "lucide-react";
import { useModels } from "@/hooks/queries/useModels";

interface ProviderIconProps {
  providerId: string;
  className?: string;
}

export function ProviderIcon({ providerId, className }: ProviderIconProps) {
  const { data: providers = [] } = useModels();
  const providerType = providers.find(
    (provider) => provider.id === providerId,
  )?.providerType;

  if ((providerType ?? providerId) !== "opencode") {
    return (
      <Bot aria-hidden="true" className={cn("size-3.5 shrink-0", className)} />
    );
  }

  return (
    <svg
      viewBox="0 6 24 30"
      role="img"
      aria-label="OpenCode"
      className={cn("size-3.5 shrink-0", className)}
    >
      <path d="M18 30H6V18H18V30Z" fill="currentColor" opacity="0.45" />
      <path d="M18 12H6V30H18V12ZM24 36H0V6H24V36Z" fill="currentColor" />
    </svg>
  );
}
