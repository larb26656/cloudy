import preview from "@/storybook/preview";
import {
  AgentAvatar,
  agentAvatarAmbient,
  agentAvatarColors,
  agentAvatarFaceDecorations,
  agentAvatarFacewear,
  agentAvatarHeadwear,
  agentAvatarEyes,
  agentAvatarShapes,
} from "./AgentAvatar";

const meta = preview.meta({
  title: "Components/AgentAvatar",
  component: AgentAvatar,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    shape: { control: "select", options: agentAvatarShapes },
    color: { control: "select", options: Object.keys(agentAvatarColors) },
    eyes: { control: "select", options: agentAvatarEyes },
    headwear: { control: "select", options: agentAvatarHeadwear },
    facewear: { control: "select", options: agentAvatarFacewear },
    faceDecoration: { control: "select", options: agentAvatarFaceDecorations },
    ambient: { control: "select", options: agentAvatarAmbient },
  },
});

export default meta;

export const Default = meta.story({
  args: {
    className: "size-40",
    shape: "orb",
    color: "sky",
    eyes: "awake",
    headwear: "none",
    facewear: "none",
    faceDecoration: "none",
    ambient: "none",
  },
});

export const BuilderParts = meta.story({
  render: () => (
    <div className="grid grid-cols-4 gap-5 rounded-xl border bg-background p-6">
      {agentAvatarShapes.map((shape, index) => (
        <AgentAvatar
          key={shape}
          shape={shape}
          color={["sky", "mint", "tangerine", "violet", "rose", "gold"][index]}
          className="size-20"
        />
      ))}
      {agentAvatarEyes.map((eyes) => (
        <AgentAvatar key={eyes} eyes={eyes} className="size-20" />
      ))}
      {agentAvatarHeadwear.map((headwear) => (
        <AgentAvatar
          key={`headwear-${headwear}`}
          headwear={headwear}
          className="size-20"
        />
      ))}
      {agentAvatarFacewear.map((facewear) => (
        <AgentAvatar
          key={`facewear-${facewear}`}
          facewear={facewear}
          className="size-20"
        />
      ))}
      {agentAvatarFaceDecorations.map((faceDecoration) => (
        <AgentAvatar
          key={`face-decoration-${faceDecoration}`}
          faceDecoration={faceDecoration}
          className="size-20"
        />
      ))}
      {agentAvatarAmbient.map((ambient) => (
        <AgentAvatar
          key={`ambient-${ambient}`}
          ambient={ambient}
          className="size-20"
        />
      ))}
    </div>
  ),
});
