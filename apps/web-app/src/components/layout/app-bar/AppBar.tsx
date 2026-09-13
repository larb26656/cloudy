import { forwardRef } from "react";
import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";

interface AppBarProps extends ComponentProps<"header"> {
  sticky?: boolean;
}

function AppBarRoot({ sticky, className, ...props }: AppBarProps) {
  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center border-b bg-background",
        sticky && "sticky top-0 z-10",
        className,
      )}
      {...props}
    />
  );
}

function Leading({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex h-full items-center gap-1 pl-2", className)}
      {...props}
    />
  );
}

interface AppBarTitleProps extends ComponentProps<"div"> {
  children: ReactNode;
}

function Title({ children, className, ...props }: AppBarTitleProps) {
  return (
    <div
      className={cn(
        "flex h-full min-w-0 flex-1 items-center gap-2.5 px-4 text-left",
        className,
      )}
      {...props}
    >
      <span className="truncate text-base font-semibold">{children}</span>
    </div>
  );
}

function Actions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex h-full items-center gap-1 pr-3", className)}
      {...props}
    />
  );
}

type ActionIconSize = "sm" | "md" | "lg";

interface ActionIconProps extends Omit<
  ComponentProps<typeof Button>,
  "children" | "size"
> {
  icon: LucideIcon;
  label: string;
  size?: ActionIconSize;
}

const ActionIcon = forwardRef<HTMLButtonElement, ActionIconProps>(
  function ActionIcon(
    { icon: Icon, label, size = "sm", className, ...props },
    ref,
  ) {
    const buttonSize =
      size === "lg" ? "icon-lg" : size === "md" ? "icon" : "icon-sm";
    const iconClass = size === "lg" ? "size-6" : "size-5";
    return (
      <Button
        ref={ref}
        variant="ghost"
        size={buttonSize}
        aria-label={label}
        title={label}
        className={className}
        {...props}
      >
        <Icon className={iconClass} />
      </Button>
    );
  },
);

export const AppBar = Object.assign(AppBarRoot, {
  Leading,
  Title,
  Actions,
  ActionIcon,
});
