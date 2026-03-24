import { Sprite } from "../../Sprite";
import { useChatUIStore } from "@/stores/chatUIStore";

export default function ThinkingAnimation() {
  const isDarkMode = useChatUIStore((state) => state.isDarkMode);

  return (
    <Sprite
      src={isDarkMode ? "/sprite/thinking-dark.png" : "/sprite/thinking.png"}
      frameWidth={96}
      frameHeight={64}
      cols={2}
      rows={3}
      totalFramesOverride={5}
      fps={4}
    />
  );
}
