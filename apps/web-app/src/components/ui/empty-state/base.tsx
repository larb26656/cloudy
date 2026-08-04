import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Center } from "@/components/layout";
import { cn } from "@/lib/utils";

export type StateSize = "full" | "compact" | "inline";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  image?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  size?: StateSize;
}

export function EmptyState({
  icon: Icon,
  image,
  title,
  description,
  action,
  size = "full",
  className,
  ...props
}: EmptyStateProps) {
  if (size === "inline") {
    return (
      <Center
        className={cn("gap-2 py-2 px-2 text-center", className)}
        {...props}
      >
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        <span className="text-sm text-muted-foreground">{title}</span>
      </Center>
    );
  }

  const isFull = size === "full";
  const badgeSize = isFull ? "size-16" : "size-12";
  const glyphSize = isFull ? "size-8" : "size-6";
  const titleClass = isFull
    ? "text-lg font-semibold"
    : "text-base font-semibold";
  const descClass = isFull
    ? "mt-1 max-w-md text-sm text-muted-foreground"
    : "mt-1 max-w-xs text-sm text-muted-foreground";
  const actionClass = isFull ? "mt-4" : "mt-3";
  const padY = isFull ? "py-16" : "py-8";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        padY,
        className,
      )}
      {...props}
    >
      {image ? (
        <img src={image} alt="" className="mb-4 size-24 object-contain" />
      ) : Icon ? (
        <Center
          className={cn(
            "mb-4 rounded-full bg-muted text-muted-foreground",
            badgeSize,
          )}
        >
          <Icon className={glyphSize} />
        </Center>
      ) : null}
      <h3 className={titleClass}>{title}</h3>
      {description && <p className={descClass}>{description}</p>}
      {action && <div className={actionClass}>{action}</div>}
    </div>
  );
}
