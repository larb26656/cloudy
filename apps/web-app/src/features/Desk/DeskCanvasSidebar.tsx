import { useState } from "react";
import {
  MessageSquareIcon,
  BotIcon,
  WorkflowIcon,
  PlusIcon,
  PanelRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateChatDialog } from "@/features/chat/components/CreateChatDialog";

interface DeskCanvasSidebarProps {
  onAddNode: (type: string, data?: Record<string, unknown>) => void;
}

export function DeskCanvasSidebar({ onAddNode }: DeskCanvasSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [createChatOpen, setCreateChatOpen] = useState(false);

  const nodeTemplates = [
    {
      id: "chat",
      label: "Chat",
      icon: MessageSquareIcon,
      onClick: () => setCreateChatOpen(true),
    },
    {
      id: "agent",
      label: "Agent",
      icon: BotIcon,
      onClick: () => onAddNode("agent"),
    },
    {
      id: "workflow",
      label: "Workflow",
      icon: WorkflowIcon,
      onClick: () => onAddNode("workflow"),
    },
  ];

  return (
    <div className="absolute top-0 bottom-0 right-0 z-10 flex items-stretch">
      <div
        className={`flex flex-col border-l bg-background shadow-lg transition-all duration-200 ease-in-out overflow-hidden ${
          isExpanded ? "w-48" : "w-0"
        }`}
      >
        <div className="flex flex-col h-full p-2">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-medium text-muted-foreground">
              Add Node
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setIsExpanded(false)}
              className="shrink-0"
            >
              <PanelRightIcon className="size-3" />
            </Button>
          </div>
          <div className="flex flex-col gap-1">
            {nodeTemplates.map((node) => (
              <Button
                key={node.id}
                variant="ghost"
                size="sm"
                className="justify-start gap-2 h-8"
                onClick={node.onClick}
              >
                <node.icon className="size-4" />
                <span>{node.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-12 bg-background border rounded-l-md shadow-md flex items-center justify-center hover:bg-muted transition-colors"
        >
          <PlusIcon className="size-4" />
        </button>
      )}

      <CreateChatDialog
        open={createChatOpen}
        onOpenChange={setCreateChatOpen}
        onCreated={(data) => {
          onAddNode("chat", data);
        }}
      />
    </div>
  );
}
