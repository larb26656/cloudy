import {
  Lightbulb,
  Clock,
  Tag,
  Trash2,
  MoreVertical,
  Circle,
  Loader2,
  CheckCircle2,
  Archive,
} from 'lucide-react';
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
import type { Idea } from '@/types/memory';

interface IdeaCardProps {
  idea: Idea;
  isSelected?: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const statusConfig = {
  draft: { label: 'Draft', icon: Circle, className: 'text-muted-foreground' },
  'in-progress': {
    label: 'In Progress',
    icon: Loader2,
    className: 'text-blue-500',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    className: 'text-green-500',
  },
  archived: { label: 'Archived', icon: Archive, className: 'text-orange-500' },
};

const priorityConfig = {
  low: { label: 'Low', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  medium: {
    label: 'Medium',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  high: {
    label: 'High',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function IdeaCard({ idea, isSelected, onSelect, onDelete }: IdeaCardProps) {
  const status = statusConfig[idea.meta.status];
  const priority = priorityConfig[idea.meta.priority];
  const StatusIcon = status.icon;

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
            <Lightbulb className="size-4 text-muted-foreground" />
            <CardTitle className="line-clamp-1">{idea.name}</CardTitle>
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
          {idea.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs ${status.className}`}>
          <StatusIcon className="size-3" />
          {status.label}
        </span>
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${priority.className}`}>
          {priority.label} priority
        </span>
        {idea.meta.tags.map((tag) => (
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
        Created {formatDate(idea.meta.createdAt)}
        {idea.meta.updatedAt !== idea.meta.createdAt && (
          <span className="ml-2">
            · Updated {formatDate(idea.meta.updatedAt)}
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
