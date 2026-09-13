import { useTheme } from "next-themes";
import { Sprite } from "../../Sprite";

const defaultDarkSrc = "/sprite/thinking-dark.png";
const defaultLightSrc = "/sprite/thinking.png";

interface ThinkingAnimationProps {
  lightSrc?: string;
  darkSrc?: string;
}

export function ThinkingAnimation({
  lightSrc = defaultLightSrc,
  darkSrc = defaultDarkSrc,
}: ThinkingAnimationProps) {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";

  return (
    <Sprite
      src={isDarkMode ? darkSrc : lightSrc}
      frameWidth={96}
      frameHeight={64}
      cols={2}
      rows={3}
      totalFramesOverride={5}
      fps={4}
    />
  );
}
