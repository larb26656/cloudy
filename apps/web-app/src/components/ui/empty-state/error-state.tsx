import { EmptyState } from "./base.tsx";

export function ErrorState({
  description = "Failed to load data. Please try again",
  action,
  ...props
}: Omit<Parameters<typeof EmptyState>[0], "icon" | "title">) {
  return (
    <EmptyState
      image="/mascot/error.png"
      title="Something went wrong"
      description={description}
      action={action}
      {...props}
    />
  );
}
