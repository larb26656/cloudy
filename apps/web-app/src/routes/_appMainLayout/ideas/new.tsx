import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { IdeaDetailView } from "@/features/idea/components/IdeaDetailDialog";
import { CREATE_IDEA_ID } from "@/features/idea/components/IdeaDetailDialog";
import type { IdeaDetail } from "@/features/idea/types";

export const Route = createFileRoute("/_appMainLayout/ideas/new")({
  component: CreateIdeaPage,
});

function CreateIdeaPage() {
  const navigate = useNavigate();

  const handleIdeaCreated = useCallback(
    (idea: IdeaDetail) => {
      navigate({ to: "/ideas/$id", params: { id: idea.id } });
    },
    [navigate],
  );

  const handleBack = useCallback(() => {
    navigate({ to: "/ideas" });
  }, [navigate]);

  return (
    <IdeaDetailView
      ideaId={CREATE_IDEA_ID}
      onBack={handleBack}
      onIdeaCreated={handleIdeaCreated}
    />
  );
}
