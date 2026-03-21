import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_appMainLayout/memory")({
  component: function Memory() {
    return <div>Memory Page</div>;
  },
});
