import preview from "@/storybook/preview";
import { SkillTool } from "./SkillTool";

const meta = preview.meta({
  title: "Chat/Message/Parts/ToolComponents/SkillTool",
  component: SkillTool,
  tags: ["autodocs"],
  argTypes: {
    tool: { control: "text", description: "Tool name" },
    state: {
      control: "object",
      description: "Tool state from SDK",
    },
  },
});

export default meta;

export const NamedSkill = meta.story({
  name: "Named skill",
  args: {
    tool: "skill",
    state: {
      status: "completed",
      input: { name: "frontend-design" },
      output: "Skill applied",
      title: "skill",
      metadata: {},
      time: { start: 1690000000000, end: 1690000007500 },
    } as any,
  },
});

export const Running = meta.story({
  args: {
    tool: "skill",
    state: {
      status: "running",
      input: { name: "create-controller-it-test" },
      time: { start: 1690000000000 },
    } as any,
  },
});

export const Pending = meta.story({
  args: {
    tool: "skill",
    state: {
      status: "pending",
      input: {},
      raw: "{}",
    } as any,
  },
});
