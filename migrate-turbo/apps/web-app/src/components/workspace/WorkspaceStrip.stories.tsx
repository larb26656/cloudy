import { useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { WorkspaceStrip } from "./WorkspaceStrip";
import { useWorkspaceStore, WORKSPACE_COLORS } from "@/stores/workspaceStore";

const TEST_INSTANCE_ID = "storybook-test-instance";

const meta: Meta<typeof WorkspaceStrip> = {
  title: "Workspace/WorkspaceStrip",
  component: WorkspaceStrip,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function WorkspaceStoriesWrapper({
  children,
  workspaces,
}: {
  children: React.ReactNode;
  workspaces?: Array<{
    name: string;
    color: (typeof WORKSPACE_COLORS)[number];
    directory: string;
  }>;
}) {
  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace);
  const existingWorkspaces = useWorkspaceStore((state) => state.workspaces);

  useEffect(() => {
    if (workspaces && existingWorkspaces.length === 0) {
      for (const ws of workspaces) {
        createWorkspace(TEST_INSTANCE_ID, ws);
      }
    }
  }, [workspaces, existingWorkspaces.length, createWorkspace]);

  return <>{children}</>;
}

export const Default: Story = {
  decorators: [
    (Story) => (
      <WorkspaceStoriesWrapper>
        <div className="h-[500px] flex">
          <Story />
        </div>
      </WorkspaceStoriesWrapper>
    ),
  ],
};

export const WithThreeWorkspaces: Story = {
  decorators: [
    (Story) => (
      <WorkspaceStoriesWrapper
        workspaces={[
          { name: "Personal", color: WORKSPACE_COLORS[0], directory: "/personal" },
          { name: "Work", color: WORKSPACE_COLORS[1], directory: "/work" },
          { name: "Projects", color: WORKSPACE_COLORS[2], directory: "/projects" },
        ]}
      >
        <div className="h-[500px] flex">
          <Story />
        </div>
      </WorkspaceStoriesWrapper>
    ),
  ],
};
