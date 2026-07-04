import { EmptyState } from "./base.tsx";
import errorUrl from "/mascot/error.png?url";

export function ErrorState({
  description = "Failed to load data. Please try again",
  action,
  ...props
}: Omit<Parameters<typeof EmptyState>[0], "icon" | "title">) {
  return (
    <EmptyState
      image={errorUrl}
      title="Something went wrong"
      description={description}
      action={action}
      {...props}
    />
  );
}
