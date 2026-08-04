import preview from "@/storybook/preview";
import { Button } from "../button";
import { EmptyState } from "../empty-state/base";

const meta = preview.meta({
  title: "UI/RouteState",
  component: EmptyState,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

export default meta;

export const ErrorState = meta.story({
  args: {
    image: "/mascot/error.png",
    title: "Something went wrong",
    description: "Failed to load data. Please try again",
  },
  render: (args) => (
    <div className="flex min-h-96 w-full items-center justify-center bg-muted/40">
      <EmptyState {...args} />
    </div>
  ),
});

export const ErrorStateWithAction = meta.story({
  render: () => (
    <div className="flex min-h-96 w-full items-center justify-center bg-muted/40">
      <EmptyState
        image="/mascot/error.png"
        title="Something went wrong"
        description="Failed to load data. Please try again"
        action={<Button>Go home</Button>}
      />
    </div>
  ),
});

export const NotFound = meta.story({
  render: () => (
    <div className="flex min-h-96 w-full items-center justify-center bg-muted/40">
      <EmptyState
        image="/mascot/404.png"
        title="Page not found"
        description="The page or resource you're looking for doesn't exist"
      />
    </div>
  ),
});

export const NotFoundWithAction = meta.story({
  render: () => (
    <div className="flex min-h-96 w-full items-center justify-center bg-muted/40">
      <EmptyState
        image="/mascot/404.png"
        title="Page not found"
        description="The page or resource you're looking for doesn't exist"
        action={<Button>Go home</Button>}
      />
    </div>
  ),
});
