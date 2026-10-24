import preview from "@/storybook/preview";
import { AgentAvatarBuilder } from "./AgentAvatarBuilder";

const meta = preview.meta({
  title: "Components/AgentAvatarBuilder",
  component: AgentAvatarBuilder,
  parameters: { layout: "padded" },
});

export default meta;

export const Default = meta.story({
  args: {
    defaultValues: {
      color: "violet",
      eyes: "happy",
      faceDecoration: "blush",
    },
  },
});
