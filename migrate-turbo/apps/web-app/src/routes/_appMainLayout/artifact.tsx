import { createFileRoute } from '@tanstack/react-router';
import ArtifactPage from '@/features/artifact/ArtifactPage';

export const Route = createFileRoute('/_appMainLayout/artifact')({
  component: ArtifactPage,
});
