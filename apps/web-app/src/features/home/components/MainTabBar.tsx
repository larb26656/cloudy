import { useState } from "react";
import { Home, Plus } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import { useTabStore, type Tab } from "@/stores/tabStore";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { tabTemplates, tabTypeMap } from "../tabs/template";
import { SortableTab } from "./SortableTab";

export function MainTabBar() {
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const setActiveTab = useTabStore((s) => s.setActiveTab);
  const removeTab = useTabStore((s) => s.removeTab);
  const addTab = useTabStore((s) => s.addTab);
  const reorderTabs = useTabStore((s) => s.reorderTabs);

  const [activeCreateDialog, setActiveCreateDialog] = useState<
    Tab["type"] | null
  >(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleMenuClick = (template: (typeof tabTemplates)[number]) => {
    if (template.CreateDialog) {
      setActiveCreateDialog(template.type as Tab["type"]);
      return;
    }
    if (template.defaultData !== undefined) {
      (addTab as (type: Tab["type"], data: unknown) => string)(
        template.type as Tab["type"],
        template.defaultData,
      );
    }
  };

  const renderTabBar = (tab: Tab, interactive: boolean) => {
    const template = tabTypeMap[tab.type];
    if (!template) return null;
    const TabBar = template.TabBarComponent;
    return (
      <TabBar
        tab={tab}
        isActive={activeTabId === tab.id}
        onClick={interactive ? () => setActiveTab(tab.id) : () => {}}
        onClose={interactive ? () => removeTab(tab.id) : () => {}}
      />
    );
  };

  const dragTab = dragId ? tabs.find((t) => t.id === dragId) ?? null : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e: DragStartEvent) => setDragId(e.active.id as string)}
        onDragEnd={(e: DragEndEvent) => {
          setDragId(null);
          const { active, over } = e;
          if (over && active.id !== over.id) {
            reorderTabs(active.id as string, over.id as string);
          }
        }}
        onDragCancel={() => setDragId(null)}
      >
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("home")}
            className={cn(
              "relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors duration-150",
              activeTabId === "home"
                ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="[&>svg]:size-4">
              <Home />
            </span>
          </button>

          <SortableContext
            items={tabs.map((t) => t.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex flex-1 overflow-x-auto scrollbar-none">
              {tabs.map((tab) => (
                <SortableTab key={tab.id} id={tab.id}>
                  {renderTabBar(tab, true)}
                </SortableTab>
              ))}
            </div>
          </SortableContext>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  <Plus size={16} />
                </button>
              }
            />
            <DropdownMenuContent align="end">
              {tabTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <DropdownMenuItem
                    key={template.type}
                    onClick={() => handleMenuClick(template)}
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
        </div>

        <DragOverlay dropAnimation={null}>
          {dragTab ? renderTabBar(dragTab, false) : null}
        </DragOverlay>
      </DndContext>

      {tabTemplates.map((template) => {
        const Dialog = template.CreateDialog;
        if (!Dialog) return null;
        return (
          <Dialog
            key={template.type}
            open={activeCreateDialog === template.type}
            onOpenChange={(next) => {
              setActiveCreateDialog(next ? (template.type as Tab["type"]) : null);
            }}
          />
        );
      })}
    </>
  );
}
