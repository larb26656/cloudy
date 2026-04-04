import { createFileRoute } from "@tanstack/react-router";
import { TestCard } from "@cloudy/chat-ui";

function TestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <TestCard />
    </div>
  );
}

export const Route = createFileRoute("/_appMainLayout/test")({
  component: TestPage,
});
