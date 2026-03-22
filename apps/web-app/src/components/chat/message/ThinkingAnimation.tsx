import { Sprite } from "../../Sprite";

export default function ThinkingAnimation() {
  return (
    <Sprite
      src="/sprite/thinking.png"
      frameWidth={96}
      frameHeight={64}
      cols={2}
      rows={3}
      totalFramesOverride={5}
      fps={4}
    />
  );
}
