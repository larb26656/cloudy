import preview from "@/storybook/preview";
import { SubtaskPart } from "./SubtaskPart";

const meta = preview.meta({
  title: "Chat/Message/Parts/SubtaskPart",
  component: SubtaskPart,
  tags: ["autodocs"],
  argTypes: {
    part: {
      control: "object",
      description: "Subtask part data from SDK",
    },
  },
});

export default meta;

export const Default = meta.story({
  args: {
    part: {
      type: "subtask",
      agent: "code-reviewer",
      description: "Review the PR for best practices",
    } as any,
  },
});

export const WithPrompt = meta.story({
  args: {
    part: {
      type: "subtask",
      agent: "test-generator",
      description: "Generate unit tests",
      prompt: "Create tests for the authentication module covering:\n- Login flow\n- Password reset\n- Token refresh",
    } as any,
  },
});

export const WithoutAgent = meta.story({
  args: {
    part: {
      type: "subtask",
      description: "Analyze the codebase structure",
    } as any,
  },
});
