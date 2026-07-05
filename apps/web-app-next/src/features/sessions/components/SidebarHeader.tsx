import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { AppNav } from "@/features/app/components";

interface SidebarHeaderProps {
  onSearchChange: (query: string) => void;
  searchQuery: string;
  onCreateSession?: () => void;
}

export function SidebarHeader({
  onSearchChange,
  searchQuery,
  onCreateSession,
}: SidebarHeaderProps) {
  return (
    <div className="flex flex-col">
      <AppNav />
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
        <Button size={"icon"} onClick={onCreateSession} variant={"ghost"}>
          <Plus className="size-5" />
        </Button>
      </div>
    </div>
  );
}
