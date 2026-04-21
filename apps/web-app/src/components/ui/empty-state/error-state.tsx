import { EmptyState } from "./base.tsx";
import error from "@/assets/mascot/happy.png";

export function ErrorState({
  description = "Failed to load data. Please try again",
  action,
  ...props
}: Omit<Parameters<typeof EmptyState>[0], "icon" | "title">) {
  return (
    <EmptyState
      image={error}
      title="Something went wrong"
      description={description}
      action={action}
      {...props}
    />
  );
}
