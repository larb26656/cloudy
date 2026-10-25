import type { ComponentProps } from "react";
import { cn } from "@repo/ui/lib/utils";

const variantClasses = {
  default: "mx-auto w-full max-w-4xl px-6 py-10 lg:max-w-6xl lg:px-10",
  page: "mx-auto w-full max-w-4xl px-6 py-10 md:px-10",
  narrow: "mx-auto w-full max-w-3xl px-6 py-10",
  settings: "mx-auto w-full max-w-3xl p-4 md:p-8",
  chat: "mx-auto w-full max-w-4xl",
} as const;

interface BoxContainerProps extends ComponentProps<"div"> {
  variant?: keyof typeof variantClasses;
}

export function BoxContainer({
  variant = "default",
  className,
  ...props
}: BoxContainerProps) {
  return <div className={cn(variantClasses[variant], className)} {...props} />;
}
