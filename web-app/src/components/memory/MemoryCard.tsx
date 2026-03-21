import { FileText, Clock, Tag, Trash2, MoreVertical } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Memory } from '@/types/memory';

interface MemoryCardProps {
  memory: Memory;
  isSelected?: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
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
        isSelected ? 'ring-2 ring-primary' : ''
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
        <CardDescription className="line-clamp-2">
          {memory.content}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-1.5">
        {memory.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
          >
            <Tag className="size-3" />
            {tag}
          </span>
        ))}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <Clock className="mr-1 size-3" />
        Created {formatDate(memory.created)}
        {memory.updated > memory.created && (
          <span className="ml-2">
            · Updated {formatDate(memory.updated)}
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
