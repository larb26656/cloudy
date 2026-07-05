import { DeskPage } from "@/features/desk/DeskPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_appMainLayout/desk")({
  component: DeskPage,
});
