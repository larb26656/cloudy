import { Sprite } from "../../Sprite";
import { useChatUIStore } from "@/stores/chatUIStore";

import thinkingDarkUrl from "/sprite/thinking-dark.png?url";
import thinkingUrl from "/sprite/thinking.png?url";

export default function ThinkingAnimation() {
  const isDarkMode = useChatUIStore((state) => state.isDarkMode);

  return (
    <Sprite
      src={isDarkMode ? thinkingDarkUrl : thinkingUrl}
      frameWidth={96}
      frameHeight={64}
      cols={2}
      rows={3}
      totalFramesOverride={5}
      fps={4}
    />
  );
}
