import { ThinkingOrb } from "thinking-orbs";

export function ThinkingAnimation() {
  return (
    <div className="flex items-center gap-2" role="status">
      <ThinkingOrb state="working" size={20} aria-hidden="true" />
      <span className="thinking-shimmer text-sm">Working ...</span>
    </div>
  );
}
