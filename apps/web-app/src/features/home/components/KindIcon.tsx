import { ProviderIcon } from "@/components/provider/ProviderIcon";
import { AgentAvatar } from "@/components/agent-avatar/AgentAvatar";
import type { AgentAvatarRecipe } from "@/components/agent-avatar/AgentAvatar";

export function KindIcon({
  avatar,
  providerId,
}: {
  avatar?: AgentAvatarRecipe;
  providerId: string;
}) {
  return avatar ? (
    <AgentAvatar {...avatar} className="size-10" />
  ) : (
    <ProviderIcon providerId={providerId} />
  );
}
