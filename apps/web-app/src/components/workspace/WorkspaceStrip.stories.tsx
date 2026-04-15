import type { Meta, StoryObj } from "@storybook/react";
import { WorkspaceStrip } from "./WorkspaceStrip";
import { createWorkspaceStore, WORKSPACE_COLORS } from "@/stores/workspaceStore";

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

function SetupWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export const Default: Story = {
  decorators: [
    (Story) => (
      <SetupWrapper>
        <div className="h-[500px] flex">
          <Story />
        </div>
      </SetupWrapper>
    ),
  ],
};

export const WithThreeWorkspaces: Story = {
  decorators: [
    (Story) => {
      const store = createWorkspaceStore(TEST_INSTANCE_ID);
      if (store.getState().workspaces.length === 0) {
        store.getState().createWorkspace(TEST_INSTANCE_ID, {
          name: "Personal",
          color: WORKSPACE_COLORS[0],
          directory: "/personal",
        });
        store.getState().createWorkspace(TEST_INSTANCE_ID, {
          name: "Work",
          color: WORKSPACE_COLORS[1],
          directory: "/work",
        });
        store.getState().createWorkspace(TEST_INSTANCE_ID, {
          name: "Projects",
          color: WORKSPACE_COLORS[2],
          directory: "/projects",
        });
      }

      return (
        <SetupWrapper>
          <div className="h-[500px] flex">
            <Story />
          </div>
        </SetupWrapper>
      );
    },
  ],
};
