import { useEffect, useRef, useState } from "react";
import { Home, Layers, Plus } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { tabTemplates } from "../tabs/template";
import { AllTabsDialog } from "./AllTabsDialog";
import { TabBarItem } from "./TabBarItem";
import { SortableTab } from "./SortableTab";
import { TabItemShell } from "./TabItemShell";

export function MainTabBar() {
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const setActiveTab = useTabStore((s) => s.setActiveTab);
  const removeTab = useTabStore((s) => s.removeTab);
  const addTab = useTabStore((s) => s.addTab);
  const reorderTabs = useTabStore((s) => s.reorderTabs);

  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [activeCreateDialog, setActiveCreateDialog] = useState<
    Tab["type"] | null
  >(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [allTabsOpen, setAllTabsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (!activeTabId || activeTabId === "home") return;

    const container = containerRef.current;
    const tabElement = tabRefs.current.get(activeTabId);

    if (container && tabElement) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = tabElement.getBoundingClientRect();

      if (tabRect.left < containerRect.left) {
        container.scrollTo({
          left: container.scrollLeft + (tabRect.left - containerRect.left) - 16,
          behavior: "smooth",
        });
      } else if (tabRect.right > containerRect.right) {
        container.scrollTo({
          left:
            container.scrollLeft + (tabRect.right - containerRect.right) + 16,
          behavior: "smooth",
        });
      }
    }
  });

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
    return (
      <TabBarItem
        tab={tab}
        isActive={activeTabId === tab.id}
        onClick={interactive ? () => setActiveTab(tab.id) : () => {}}
        onClose={interactive ? () => removeTab(tab.id) : () => {}}
      />
    );
  };

  const dragTab = dragId ? (tabs.find((t) => t.id === dragId) ?? null) : null;

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
          <TabItemShell
            icon={Home}
            isActive={activeTabId === "home"}
            onClick={() => setActiveTab("home")}
          />

          <SortableContext
            items={tabs.map((t) => t.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div
              ref={containerRef}
              className="flex flex-1 overflow-x-auto scrollbar-none"
            >
              {tabs.map((tab) => (
                <div
                  ref={(node) => {
                    if (node) {
                      tabRefs.current.set(tab.id, node);
                    } else {
                      tabRefs.current.delete(tab.id);
                    }
                  }}
                  key={tab.id}
                >
                  <SortableTab id={tab.id}>
                    {renderTabBar(tab, true)}
                  </SortableTab>
                </div>
              ))}
            </div>
          </SortableContext>

          {tabs.length > 0 && (
            <button
              onClick={() => setAllTabsOpen(true)}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Layers size={16} />
              <span>{tabs.length}</span>
            </button>
          )}

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
              setActiveCreateDialog(
                next ? (template.type as Tab["type"]) : null,
              );
            }}
          />
        );
      })}

      <AllTabsDialog open={allTabsOpen} onOpenChange={setAllTabsOpen} />
    </>
  );
}
