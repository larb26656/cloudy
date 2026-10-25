import { useState, type CSSProperties, type ReactNode } from "react";
import { GripVertical, Plus, X } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import { AgentSelector } from "@/components/chat/AgentSelector";
import { ProviderSelector } from "@/components/chat/ProviderSelector";
import { AgentAvatar } from "@/components/agent-avatar/AgentAvatar";
import { ProviderIcon } from "@/components/provider/ProviderIcon";
import { useAgents } from "@/hooks/queries/useAgents";
import { useCloudyAgents } from "@/hooks/queries/useCloudyAgents";
import { useDefaultProviderStore } from "@/stores/defaultProviderStore";
import { usePinnedAgentsStore } from "@/stores/pinnedAgentsStore";

export function PinnedAgentsSettings() {
  const defaultProviderId = useDefaultProviderStore(
    (state) => state.defaultProviderId,
  );
  const [providerId, setProviderId] = useState(defaultProviderId);
  const [agentId, setAgentId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: agents = [] } = useAgents({ providerId });
  const { data: cloudyAgents } = useCloudyAgents();
  const pins = usePinnedAgentsStore((state) => state.pins);
  const addPin = usePinnedAgentsStore((state) => state.addPin);
  const removePin = usePinnedAgentsStore((state) => state.removePin);
  const reorderPins = usePinnedAgentsStore((state) => state.reorderPins);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      reorderPins(String(active.id), String(over.id));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Pinned Agents</h2>
          <p className="text-sm text-muted-foreground">
            Keep your go-to agents on the home page for quick access. Drag the
            handle to reorder.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Add agent"
                title="Add agent"
              >
                <Plus />
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Pin an agent</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Provider</p>
                <ProviderSelector
                  providerId={providerId}
                  variant="form"
                  onChange={(value) => {
                    if (value) {
                      setProviderId(value);
                      setAgentId("");
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Agent</p>
                <AgentSelector
                  variant="form"
                  providerId={providerId}
                  value={agentId || null}
                  onChange={(value) => setAgentId(value ?? "")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                disabled={
                  !agentId || !agents.some((agent) => agent.id === agentId)
                }
                onClick={() => {
                  const agent = agents.find((item) => item.id === agentId);
                  if (!agent) return;
                  addPin({ providerId, agentId: agent.id, name: agent.name });
                  setAgentId("");
                  setDialogOpen(false);
                }}
              >
                Pin agent
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {pins.length ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={pins.map((pin) => `${pin.providerId}:${pin.agentId}`)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="grid gap-3">
              {pins.map((pin) => {
                const avatar = cloudyAgents?.agents.find(
                  (agent) => agent.id === pin.agentId,
                )?.avatar;
                return (
                  <SortablePinnedAgent
                    key={`${pin.providerId}:${pin.agentId}`}
                    id={`${pin.providerId}:${pin.agentId}`}
                  >
                    <span className="flex size-9 items-center justify-center">
                      {avatar ? (
                        <AgentAvatar {...avatar} className="size-9" />
                      ) : (
                        <ProviderIcon
                          providerId={pin.providerId}
                          className="size-5"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {pin.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {pin.providerId}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Unpin ${pin.name}`}
                      onClick={() => removePin(pin.providerId, pin.agentId)}
                    >
                      <X />
                    </Button>
                  </SortablePinnedAgent>
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="rounded-lg border p-4 text-sm text-muted-foreground">
          No pinned agents yet.
        </p>
      )}
    </div>
  );
}

function SortablePinnedAgent({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border p-4",
        isDragging && "z-10 shadow-md",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label="Drag to reorder"
        className="flex cursor-grab touch-none items-center text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      {children}
    </li>
  );
}
