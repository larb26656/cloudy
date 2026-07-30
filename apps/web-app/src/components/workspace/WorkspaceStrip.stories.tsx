import { useEffect } from "react";
import preview from "@/storybook/preview";
import { WorkspaceStrip } from "./WorkspaceStrip";
import { useWorkspaceStore, WORKSPACE_COLORS } from "@/stores/workspaceStore";

const TEST_INSTANCE_ID = "storybook-test-instance";

const meta = preview.meta({
  title: "Workspace/WorkspaceStrip",
  component: WorkspaceStrip,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
});

export default meta;

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
        createWorkspace({ instanceId: TEST_INSTANCE_ID, ...ws });
      }
    }
  }, [workspaces, existingWorkspaces.length, createWorkspace]);

  return <>{children}</>;
}

export const Default = meta.story({
  args: { instanceId: TEST_INSTANCE_ID },
  decorators: [
    (Story) => (
      <WorkspaceStoriesWrapper>
        <div className="h-[500px] flex">
          <Story />
        </div>
      </WorkspaceStoriesWrapper>
    ),
  ],
});

export const WithThreeWorkspaces = meta.story({
  args: { instanceId: TEST_INSTANCE_ID },
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
});
