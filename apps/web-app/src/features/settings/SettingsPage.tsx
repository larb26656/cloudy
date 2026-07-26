import { Tabs } from "@/components/ui/tabs";
import { TabsContent } from "@/components/ui/tabs";
import { SettingsSidebar } from "./components/SettingsSidebar";
import { AppearanceSettings } from "./components/AppearanceSettings";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

const settingsTabs = [
  { value: "appearance", label: "Appearance", component: AppearanceSettings },
] as const;

export function SettingsPage() {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <Tabs
        orientation="vertical"
        defaultValue="appearance"
        className="flex flex-1"
      >
        <SettingsSidebar tabs={settingsTabs} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="hidden md:flex shrink-0 border-b p-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="size-4" />
                Back to home
              </Button>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {settingsTabs.map((tab) => {
              const Content = tab.component;
              return (
                <TabsContent
                  key={tab.value}
                  value={tab.value}
                  className="mt-0"
                >
                  <Content />
                </TabsContent>
              );
            })}
          </div>
        </div>
      </Tabs>
    </div>
  );
}
