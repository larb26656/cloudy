import { cn } from "@repo/ui/lib/utils";
import { Bot } from "lucide-react";
import { useModels } from "@/hooks/queries/useModels";

interface ProviderIconProps {
  providerId: string;
  className?: string;
}

interface ProviderIconSvgProps {
  className: string;
}

function CloudyIcon({ className }: ProviderIconSvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="128"
      height="128"
      viewBox="2 2.5 28 28"
      fill="none"
      role="img"
      aria-label="Cloudy"
      shapeRendering="crispEdges"
      className={className}
    >
      <path
        d="M11 9h4v1h2V9h4v2h3v3h3v3h2v5h-3v2H6v-2H3v-5h2v-3h3v-3h3V9Z"
        fill="#F5F5F4"
      />
      <path d="M11 16h2v3h-2zM19 16h2v3h-2zM14 20h4v1h-4z" fill="#555B5C" />
    </svg>
  );
}

function OpenCodeIcon({ className }: ProviderIconSvgProps) {
  return (
    <svg
      viewBox="0 6 24 30"
      role="img"
      aria-label="OpenCode"
      className={className}
    >
      <path d="M18 30H6V18H18V30Z" fill="currentColor" opacity="0.45" />
      <path d="M18 12H6V30H18V12ZM24 36H0V6H24V36Z" fill="currentColor" />
    </svg>
  );
}

function OmpIcon({ className }: ProviderIconSvgProps) {
  return (
    <svg viewBox="0 0 120 90" role="img" aria-label="OMP" className={className}>
      <rect x="10" y="8" width="100" height="12" rx="2" fill="currentColor" />
      <rect x="25" y="20" width="12" height="62" rx="2" fill="currentColor" />
      <rect x="75" y="20" width="12" height="45" rx="2" fill="currentColor" />
      <rect x="71" y="55" width="20" height="16" rx="3" fill="#f97316" />
      <rect x="76" y="59" width="3" height="8" rx="1" fill="#0d0d0d" />
      <rect x="82" y="59" width="3" height="8" rx="1" fill="#0d0d0d" />
      <circle cx="18" cy="14" r="2" fill="#f97316" opacity="0.8" />
      <circle cx="102" cy="14" r="2" fill="#f97316" opacity="0.8" />
    </svg>
  );
}

const icons = {
  cloudy: CloudyIcon,
  omp: OmpIcon,
  opencode: OpenCodeIcon,
};

export function ProviderIcon({ providerId, className }: ProviderIconProps) {
  const { data: providers = [] } = useModels();
  const providerType = providers.find(
    (provider) => provider.id === providerId,
  )?.providerType;
  const iconClassName = cn("size-3.5 shrink-0", className);
  const Icon =
    icons[providerId as keyof typeof icons] ??
    icons[providerType as keyof typeof icons];

  return Icon ? (
    <Icon className={iconClassName} />
  ) : (
    <Bot aria-hidden="true" className={iconClassName} />
  );
}
