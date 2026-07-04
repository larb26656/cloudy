import { createFileRoute } from "@tanstack/react-router";
import { InstanceSection } from "@/features/settings/components/sections/InstanceSection";

export const Route = createFileRoute("/settings/instance")({
  component: InstancePage,
});

function InstancePage() {
  return <InstanceSection />;
}
