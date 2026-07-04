import { FileText, Clock, Tag, Trash2, MoreVertical } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { formatDate } from "@/lib/date";
import type { Memory } from "@/features/memory/types";

interface MemoryCardProps {
  memory: Memory;
  isSelected?: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function MemoryCard({
  memory,
  isSelected,
  onSelect,
  onDelete,
}: MemoryCardProps) {
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
            <FileText className="size-4 text-muted-foreground" />
            <CardTitle className="line-clamp-1">{memory.name}</CardTitle>
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
        <CardDescription className="line-clamp-2"></CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {memory.meta.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
            >
              <Tag className="size-3" />
              {tag}
            </span>
          ))}
        </div>
        <span className="text-muted-foreground"> {memory.description}</span>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <Clock className="mr-1 size-3" />
        Created {formatDate(memory.meta.createdAt)}
        {memory.meta.updatedAt && (
          <span className="ml-2">
            - Updated {formatDate(memory.meta.updatedAt)}
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
