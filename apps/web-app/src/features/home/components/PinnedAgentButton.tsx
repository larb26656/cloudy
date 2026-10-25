import type { PinnedAgent } from "@/stores/pinnedAgentsStore";
import type { AgentAvatarRecipe } from "@/components/agent-avatar/AgentAvatar";
import { KindIcon } from "./KindIcon";

type PinnedAgentButtonProps = {
  pin: PinnedAgent;
  avatar?: AgentAvatarRecipe;
  disabled: boolean;
  onClick: () => void;
};

export function PinnedAgentButton({
  pin,
  avatar,
  disabled,
  onClick,
}: PinnedAgentButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex min-w-16 shrink-0 flex-col items-center gap-1 rounded-lg px-1 py-1 text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      aria-label={`Start chat with ${pin.name} using ${pin.providerId}`}
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-muted">
        <KindIcon providerId={pin.providerId} avatar={avatar} />
      </span>
      <span className="max-w-16 truncate font-medium">{pin.name}</span>
    </button>
  );
}
