import { FileCode, Clock, Tag, Trash2, MoreVertical } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardAction,
} from "@cloudy/ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@cloudy/ui";
import { TypeBadge } from "@/features/artifact/components";
import { formatDate } from "@/lib/date";
import type { Artifact } from "@/features/artifact/types";

interface ArtifactCardProps {
  artifact: Artifact;
  isSelected?: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function ArtifactCard({
  artifact,
  isSelected,
  onSelect,
  onDelete,
}: ArtifactCardProps) {
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
            <FileCode className="size-4 text-muted-foreground" />
            <CardTitle className="line-clamp-1">{artifact.name}</CardTitle>
          </div>
          <CardAction onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreVertical className="size-4" />
                </Button>
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
          <TypeBadge type={artifact.meta.type} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {artifact.meta.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
            >
              <Tag className="size-3" />
              {tag}
            </span>
          ))}
        </div>
        <span className="text-muted-foreground"> {artifact.description}</span>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <Clock className="mr-1 size-3" />
        Created {formatDate(artifact.meta.createdAt)}
        {artifact.meta.updatedAt !== artifact.meta.createdAt && (
          <span className="ml-2">
            - Updated {formatDate(artifact.meta.updatedAt)}
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
