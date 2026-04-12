import { Clock, Tag, Trash2, MoreVertical } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge, PriorityBadge } from "@/features/idea/components";
import { formatDateTime } from "@/lib/date";
import type { Idea } from "@/features/idea/types";

interface IdeaCardProps {
  idea: Idea;
  isSelected?: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function IdeaCard({
  idea,
  isSelected,
  onSelect,
  onDelete,
}: IdeaCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${
        isSelected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="line-clamp-1">{idea.name}</CardTitle>
          </div>
          <CardAction onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex shrink-0 items-center justify-center rounded-md size-8 hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground">
                <MoreVertical className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={idea.meta.status} />
          <PriorityBadge priority={idea.meta.priority} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {idea.meta.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
            >
              <Tag className="size-3" />
              {tag}
            </span>
          ))}
        </div>
        <span className="text-muted-foreground"> {idea.description}</span>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <Clock className="mr-1 size-3" />
        Updated {formatDateTime(idea.meta.updatedAt)}
      </CardFooter>
    </Card>
  );
}
