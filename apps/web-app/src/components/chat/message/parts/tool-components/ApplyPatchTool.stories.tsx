import preview from "@/storybook/preview";
import { ApplyPatchTool } from "@repo/ui/components/message";

const meta = preview.meta({
  title: "Chat/Message/Parts/ToolComponents/ApplyPatchTool",
  component: ApplyPatchTool,
  tags: ["autodocs"],
});

export default meta;

export const UpdateFile = meta.story({
  args: {
    tool: "apply_patch",
    state: {
      status: "completed",
      input: {
        patchText: `*** Begin Patch
*** Update File: packages/server/src/container.ts
@@
export const port = 3000;
-export const host = "localhost";
+export const host = "127.0.0.1";
*** End Patch`,
      },
    },
  },
});
