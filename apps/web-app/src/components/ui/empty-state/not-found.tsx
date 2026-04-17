import { EmptyState } from "./base.tsx";

export function NotFound({
  description = "The page or resource you're looking for doesn't exist",
  action,
  ...props
}: Omit<Parameters<typeof EmptyState>[0], "icon" | "title">) {
  return (
    <EmptyState
      image="/mascot/404.png"
      title="Page not found"
      description={description}
      action={action}
      {...props}
    />
  );
}
