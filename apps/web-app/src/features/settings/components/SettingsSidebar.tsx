import { TabsList } from "@/components/ui/tabs";
import { TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Palette } from "lucide-react";

interface SettingsSidebarProps {
  tabs: readonly { value: string; label: string }[];
}

export function SettingsSidebar({ tabs }: SettingsSidebarProps) {
  return (
    <>
      <aside className="hidden md:flex h-full w-60 shrink-0 flex-col border-r">
        <div className="flex items-center gap-2 px-4 py-4">
          <Palette className="size-5 text-muted-foreground" />
          <span className="font-semibold">Settings</span>
        </div>
        <Separator />
        <TabsList className="flex flex-col items-start gap-1 p-2 w-full">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="w-full justify-start px-3"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </aside>

      <div className="flex md:hidden items-center gap-2 border-b px-4 py-3">
        <Palette className="size-5 text-muted-foreground" />
        <span className="font-semibold">Settings</span>
      </div>

      <TabsList
        data-slot="tabs-list"
        className="flex md:hidden overflow-x-auto border-b px-2 py-2 gap-1"
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="px-3 py-1.5"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </>
  );
}
