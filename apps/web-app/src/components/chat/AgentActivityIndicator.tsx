import { cn, cva } from "@repo/ui/lib/utils";
import type {
  SessionAgentActivityReason,
  SessionAgentActivityState,
} from "@/hooks/useSessionAgentActivity";

interface AgentActivityIndicatorProps {
  state: SessionAgentActivityState;
  reason?: SessionAgentActivityReason;
  className?: string;
}

const agentActivityIndicatorVariants = cva(
  "inline-flex size-3 items-center justify-center rounded-full",
  {
    variants: {
      state: {
        working: "bg-info animate-pulse",
        "wait-for-human": "bg-destructive",
      },
    },
  },
);

export function AgentActivityIndicator({
  state,
  reason,
  className,
}: AgentActivityIndicatorProps) {
  if (state === "idle") return null;

  const label =
    state === "wait-for-human"
      ? reason === "permission"
        ? "Permission required"
        : "Question waiting"
      : "Working";

  return (
    <span
      className={cn(agentActivityIndicatorVariants({ state }), className)}
      role="img"
      aria-label={label}
      title={label}
    />
  );
}
