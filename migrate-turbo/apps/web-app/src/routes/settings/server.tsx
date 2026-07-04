import { createFileRoute } from "@tanstack/react-router";
import { ServerSection } from "@/features/settings/components/sections/ServerSection";

export const Route = createFileRoute("/settings/server")({
  component: ServerPage,
});

function ServerPage() {
  return <ServerSection />;
}
