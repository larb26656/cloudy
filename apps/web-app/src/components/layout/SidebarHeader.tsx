import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { SidebarNav } from "./SidebarNav";
import { useStore } from "@/hooks/instanceScopeHook";

interface SidebarHeaderProps {
  onSearchChange: (query: string) => void;
  searchQuery: string;
}

export function SidebarHeader({
  onSearchChange,
  searchQuery,
}: SidebarHeaderProps) {
  const { createTempSession } = useStore("session");

  return (
    <div className="flex flex-col">
      <SidebarNav />
      <div className="flex gap-2 p-2">
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </InputGroup>
        <Button size={"icon"} onClick={createTempSession} variant={"ghost"}>
          <Plus className="size-5" />
        </Button>
      </div>
    </div>
  );
}
