import { createFileRoute } from "@tanstack/react-router";
import { IdeaDetailView } from "@/features/idea/components/IdeaDetailDialog";

export const Route = createFileRoute("/ideas/$id")({
  component: IdeaDetailPage,
});

function IdeaDetailPage() {
  const { id } = Route.useParams();
  return <IdeaDetailView ideaId={id} viewOnly />;
}
