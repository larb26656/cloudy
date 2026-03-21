import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_appMainLayout/idea")({
  component: function Idea() {
    return <div>Idea Page</div>;
  },
});
