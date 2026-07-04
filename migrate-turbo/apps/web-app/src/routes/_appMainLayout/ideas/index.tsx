import { createFileRoute } from "@tanstack/react-router";
import IdeaPage from "@/features/idea/IdeaPage";

export const Route = createFileRoute("/_appMainLayout/ideas/")({
  component: IdeaPage,
});
