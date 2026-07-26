import { useState } from "react";
import { Sprite } from "../../Sprite";

const thinkingDarkUrl = "/sprite/thinking-dark.png";
const thinkingUrl = "/sprite/thinking.png";

export default function ThinkingAnimation() {
  const [isDarkMode] = useState(false);

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
