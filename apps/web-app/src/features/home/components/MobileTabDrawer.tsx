import type { CSSProperties, ReactNode, Ref } from "react";
import { GripVertical, Home, Plus, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTabStore } from "@/stores/tabStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { WorkspaceDot } from "@/components/workspace/WorkspaceDot";
import {
  getTabWorkspaceId,
  TabTitle,
  tabTypeMap,
  tabTemplates,
} from "../tabs/template";

interface MobileTabDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTab: (template: (typeof tabTemplates)[number]) => void;
}

export function MobileTabDrawer({
  open,
  onOpenChange,
  onAddTab,
}: MobileTabDrawerProps) {
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const setActiveTab = useTabStore((s) => s.setActiveTab);
  const removeTab = useTabStore((s) => s.removeTab);
  const reorderTabs = useTabStore((s) => s.reorderTabs);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleSelect = (id: string) => {
    setActiveTab(id);
    onOpenChange(false);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      reorderTabs(active.id as string, over.id as string);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-3/4 gap-0 p-0 sm:max-w-sm"
      >
        <SheetHeader className="flex-row items-center justify-between border-b">
          <SheetTitle>
            Tabs{tabs.length > 0 ? ` (${tabs.length})` : ""}
          </SheetTitle>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  <Plus size={16} />
                  <span>New</span>
                </button>
              }
            />
            <DropdownMenuContent align="start">
              {tabTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <DropdownMenuItem
                    key={template.type}
                    onClick={() => onAddTab(template)}
                  >
                    <span className="mr-2 [&>svg]:size-4">
                      <Icon />
                    </span>
                    {template.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </SheetHeader>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-y-auto p-2">
            <DrawerRow
              icon={Home}
              label="Home"
              isActive={activeTabId === "home"}
              onClick={() => handleSelect("home")}
            />
            <SortableContext
              items={tabs.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {tabs.map((tab) => {
                const template = tabTypeMap[tab.type];
                if (!template) return null;
                return (
                  <SortableDrawerRow
                    key={tab.id}
                    tabId={tab.id}
                    icon={template.icon}
                    label={<TabTitle tab={tab} />}
                    workspaceId={getTabWorkspaceId(tab)}
                    isActive={activeTabId === tab.id}
                    onClick={() => handleSelect(tab.id)}
                    onClose={() => removeTab(tab.id)}
                  />
                );
              })}
            </SortableContext>
          </div>
        </DndContext>
      </SheetContent>
    </Sheet>
  );
}

interface DrawerRowProps {
  icon: LucideIcon;
  label: ReactNode;
  isActive: boolean;
  onClick: () => void;
  onClose?: () => void;
  workspaceId?: string | null;
  dragHandle?: ReactNode;
  ref?: Ref<HTMLDivElement>;
  style?: CSSProperties;
}

function DrawerRow({
  icon: Icon,
  label,
  isActive,
  onClick,
  onClose,
  workspaceId,
  dragHandle,
  ref,
  style,
}: DrawerRowProps) {
  return (
    <div
      ref={ref}
      style={style}
      className={cn(
        "group flex items-center gap-1 rounded-md pr-1 transition-colors",
        isActive
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      {dragHandle}
      <button
        onClick={onClick}
        className="flex flex-1 items-center gap-2 px-3 py-2 text-left text-sm font-medium"
      >
        <span className="[&>svg]:size-4 shrink-0">
          <Icon />
        </span>
        <WorkspaceDot workspaceId={workspaceId ?? undefined} />
        <span className="truncate">{label}</span>
      </button>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close tab"
          className="rounded p-1 opacity-0 transition-opacity hover:bg-background group-hover:opacity-100"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

interface SortableDrawerRowProps extends Omit<DrawerRowProps, "ref" | "style"> {
  tabId: string;
}

function SortableDrawerRow({ tabId, ...props }: SortableDrawerRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tabId });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <DrawerRow
      {...props}
      ref={setNodeRef}
      style={style}
      dragHandle={
        <button
          ref={setActivatorNodeRef}
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
          className="flex shrink-0 cursor-grab touch-none items-center px-1 text-muted-foreground/60 transition-colors hover:text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>
      }
    />
  );
}
