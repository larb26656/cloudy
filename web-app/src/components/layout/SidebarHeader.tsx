import { Plus, Search } from "lucide-react";
import { DirectoryFilter } from "../directory/DirectoryFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarNav } from "./SidebarNav";
import { useSessionStore } from "@/stores";

interface SidebarHeaderProps {
  onSearchChange: (query: string) => void;
  searchQuery: string;
}

export function SidebarHeader({
  onSearchChange,
  searchQuery,
}: SidebarHeaderProps) {
  const { createTempSession } = useSessionStore();

  return (
    <div className="flex flex-col">
      <DirectoryFilter />
      <SidebarNav />
      <div className="flex gap-2 p-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button size={"icon"} onClick={createTempSession} variant={"ghost"}>
          <Plus className="size-5" />
        </Button>
      </div>
    </div>
  );
}
