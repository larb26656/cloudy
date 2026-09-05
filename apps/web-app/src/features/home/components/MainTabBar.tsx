import { useState } from "react";
import type { Tab } from "@/stores/tabStore";
import { useTabStore } from "@/stores/tabStore";
import { useNotificationsStream } from "@/hooks/useNotificationsStream";
import { tabTemplates } from "../tabs/template";
import { AllTabsDialog } from "./AllTabsDialog";
import { DesktopTabBar } from "./DesktopTabBar";
import { MobileTabBar } from "./MobileTabBar";
import { MobileTabDrawer } from "./MobileTabDrawer";

export function MainTabBar() {
  useNotificationsStream();
  const addTab = useTabStore((s) => s.addTab);
  const [activeCreateDialog, setActiveCreateDialog] = useState<
    Tab["type"] | null
  >(null);
  const [allTabsOpen, setAllTabsOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

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

  return (
    <>
      <DesktopTabBar
        onOpenAllTabs={() => setAllTabsOpen(true)}
        onAddTab={handleMenuClick}
      />
      <MobileTabBar onOpenDrawer={() => setMobileDrawerOpen(true)} />

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

      <MobileTabDrawer
        open={mobileDrawerOpen}
        onOpenChange={setMobileDrawerOpen}
        onAddTab={handleMenuClick}
      />
    </>
  );
}
