import type { LucideIcon } from "lucide-react";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalDistributeCenter,
  Copy,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DeskPanel } from "./DeskPanel";
import type { AlignType, DistributeAxis } from "../utils/selectionOps";

interface SelectionToolbarProps {
  selectedCount: number;
  onDuplicate: () => void;
  onDelete: () => void;
  onAlign: (type: AlignType) => void;
  onDistribute: (axis: DistributeAxis) => void;
}

const ALIGN_BUTTONS: { type: AlignType; icon: LucideIcon; label: string }[] = [
  { type: "left", icon: AlignStartVertical, label: "Align left" },
  {
    type: "centerH",
    icon: AlignCenterVertical,
    label: "Align horizontal center",
  },
  { type: "right", icon: AlignEndVertical, label: "Align right" },
  { type: "top", icon: AlignStartHorizontal, label: "Align top" },
  {
    type: "centerV",
    icon: AlignCenterHorizontal,
    label: "Align vertical center",
  },
  { type: "bottom", icon: AlignEndHorizontal, label: "Align bottom" },
];

const DISTRIBUTE_BUTTONS: {
  axis: DistributeAxis;
  icon: LucideIcon;
  label: string;
}[] = [
  {
    axis: "horizontal",
    icon: AlignHorizontalDistributeCenter,
    label: "Distribute horizontally",
  },
  {
    axis: "vertical",
    icon: AlignVerticalDistributeCenter,
    label: "Distribute vertically",
  },
];

function ToolButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <Button variant="ghost" size="icon-sm" disabled>
        <Icon className="size-4" />
      </Button>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon-sm" onClick={onClick}>
            <Icon className="size-4" />
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function SelectionToolbar({
  selectedCount,
  onDuplicate,
  onDelete,
  onAlign,
  onDistribute,
}: SelectionToolbarProps) {
  if (selectedCount === 0) return null;

  const alignEnabled = selectedCount >= 2;
  const distributeEnabled = selectedCount >= 3;

  return (
    <DeskPanel>
      <span className="px-2 text-xs font-medium tabular-nums text-muted-foreground">
        {selectedCount} selected
      </span>

      <Separator orientation="vertical" className="mx-0.5" />

      {ALIGN_BUTTONS.map((b) => (
        <ToolButton
          key={b.type}
          icon={b.icon}
          label={b.label}
          onClick={() => onAlign(b.type)}
          disabled={!alignEnabled}
        />
      ))}

      <Separator orientation="vertical" className="mx-0.5" />

      {DISTRIBUTE_BUTTONS.map((b) => (
        <ToolButton
          key={b.axis}
          icon={b.icon}
          label={b.label}
          onClick={() => onDistribute(b.axis)}
          disabled={!distributeEnabled}
        />
      ))}

      <Separator orientation="vertical" className="mx-0.5" />

      <ToolButton icon={Copy} label="Duplicate (Cmd+D)" onClick={onDuplicate} />

      <ToolButton icon={Trash2} label="Delete (Backspace)" onClick={onDelete} />
    </DeskPanel>
  );
}
