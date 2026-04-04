import { useState } from "react";
import { MoreHorizontal, Edit2, Trash2, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@cloudy/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@cloudy/ui";
import { formatRelativeFromTimestamp } from "@/lib/date";
import type { Session, SessionStatus } from "@opencode-ai/sdk/v2";

interface SessionItemProps {
  session: Session;
  isActive: boolean;
  status?: SessionStatus;
  onClick: () => void;
  onRename: (newTitle: string) => void;
  onDelete: () => void;
  onFork: () => void;
}

export function SessionItem({
  session,
  isActive,
  status,
  onClick,
  onRename,
  onDelete,
  onFork,
}: SessionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title || "");
  const [showMenu, setShowMenu] = useState(false);

  const handleRename = () => {
    if (editTitle.trim()) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
    setShowMenu(false);
  };

  // TODO fix this later
  const getStatusColor = () => {
    const type = status?.type;
    switch (type) {
      case "busy":
        return "bg-yellow-500";
      case "retry":
        return "bg-red-500";
      case "idle":
      default:
        return "bg-green-500";
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? "bg-primary dark:bg-muted text-primary-foreground dark:text-inherit"
          : "hover:bg-accent"
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full ${getStatusColor()} flex-shrink-0`}
      />

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            id={`session-edit-${session.id}`}
            name={`session-edit-${session.id}`}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") {
                setEditTitle(session.title || "");
                setIsEditing(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <>
            <p className="text-sm font-medium truncate">
              {session.title || "New Chat"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {formatRelativeFromTimestamp(session.time.updated)}
            </p>
          </>
        )}
      </div>

      {!isEditing && (
        <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="gap-2"
            >
              <Edit2 className="size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onFork();
                setShowMenu(false);
              }}
              className="gap-2"
            >
              <GitBranch className="size-4" />
              Fork
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setShowMenu(false);
              }}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
