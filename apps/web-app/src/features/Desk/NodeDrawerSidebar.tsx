import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NodeMenuButton } from "./nodes/NodeMenuButton";
import { nodeTemplates, type NodeTemplate } from "./nodes/template";

interface NodeDrawerSidebarProps {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  onAddNode: (template: NodeTemplate, data?: Record<string, unknown>) => void;
}

export function NodeDrawerSidebar({
  isOpen,
  setOpen,
  onAddNode,
}: NodeDrawerSidebarProps) {
  const [activeDialogTemplate, setActiveDialogTemplate] =
    useState<NodeTemplate | null>(null);

  const handleSelect = (template: NodeTemplate) => {
    if (template.configDialog) {
      setActiveDialogTemplate(template);
    } else {
      onAddNode(template, template.defaultData);
    }
  };

  return (
    <div className="absolute top-0 bottom-0 right-0 z-10 flex items-stretch">
      <div
        className={`flex flex-col border-l bg-background shadow-lg transition-all duration-200 ease-in-out overflow-hidden relative ${
          isOpen ? "w-48" : "w-0"
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
              onClick={() => setOpen(false)}
            >
              <X />
            </Button>
          </div>
          <div className="flex flex-col gap-1">
            {nodeTemplates.map((template) => (
              <NodeMenuButton
                key={template.id}
                icon={template.icon}
                label={template.label}
                onClick={() => handleSelect(template)}
              />
            ))}
          </div>
        </div>
      </div>

      {activeDialogTemplate?.configDialog && (
        <activeDialogTemplate.configDialog
          open={!!activeDialogTemplate}
          onOpenChange={(open) => !open && setActiveDialogTemplate(null)}
          onSubmit={(data) => {
            onAddNode(activeDialogTemplate, data);
            setActiveDialogTemplate(null);
          }}
        />
      )}
    </div>
  );
}
