import { useTheme } from "next-themes";
import { Sprite } from "../../Sprite";

const thinkingDarkUrl = "/sprite/thinking-dark.png";
const thinkingUrl = "/sprite/thinking.png";

export default function ThinkingAnimation() {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

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
