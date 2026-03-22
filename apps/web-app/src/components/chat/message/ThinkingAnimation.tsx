import { Sprite } from "../../Sprite";

export default function ThinkingSpinner() {
  return (
    <Sprite
      src="/sprite/thinking.png"
      frameWidth={48}
      frameHeight={48}
      cols={2}
      rows={3}
      fps={8}
    />
  );
}
