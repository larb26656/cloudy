import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Plus, Search, Lightbulb, X, Circle, Loader2, CheckCircle2, Archive } from 'lucide-react';
import { useIdeaStore } from '@/stores/ideaStore';
import { IdeaCard, CreateIdeaDialog } from '@/components/idea';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import type { Idea } from '@/types/memory';

export const Route = createFileRoute('/_appMainLayout/idea')({
  component: IdeaPage,
});

const filterOptions: Array<{ value: Idea['status'] | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

function IdeaPage() {
  const {
    loadIdeas,
    getFilteredIdeas,
    selectedIdeaId,
    selectIdea,
    deleteIdea,
    createIdea,
    isLoading,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
  } = useIdeaStore();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const ideas = getFilteredIdeas();
  const selectedIdea = ideas.find((i) => i.id === selectedIdeaId);

  useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

  const handleCreate = (ideaData: Parameters<typeof createIdea>[0]) => {
    const newIdea = createIdea(ideaData);
    selectIdea(newIdea.id);
  };

  return (
    <div className="flex h-full">
      <div className="flex flex-col flex-1 border-r">
        <div className="flex flex-col gap-2 border-b p-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search ideas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="size-3" />
                </Button>
              )}
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 size-4" />
              New
            </Button>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                variant={filterStatus === option.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterStatus(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-40 w-full rounded-xl" />
                  </div>
                ))}
              </>
            ) : ideas.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <Lightbulb className="size-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No ideas found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchQuery || filterStatus !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Capture your first idea to get started'}
                </p>
                {!searchQuery && filterStatus === 'all' && (
                  <Button
                    className="mt-4"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <Plus className="mr-2 size-4" />
                    Create Idea
                  </Button>
                )}
              </div>
            ) : (
              ideas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  isSelected={idea.id === selectedIdeaId}
                  onSelect={() => selectIdea(idea.id)}
                  onDelete={() => deleteIdea(idea.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <Sheet open={!!selectedIdea} onOpenChange={(open) => !open && selectIdea(null)}>
        <SheetContent className="w-full sm:max-w-2xl">
          {selectedIdea && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Lightbulb className="size-5" />
                  {selectedIdea.name}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  <span>Created {new Intl.DateTimeFormat('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(selectedIdea.created)}</span>
                  <StatusBadge status={selectedIdea.status} />
                  <PriorityBadge priority={selectedIdea.priority} />
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="mt-6 h-[calc(100vh-12rem)]">
                <MarkdownRenderer content={selectedIdea.markdown} />
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      <CreateIdeaDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreate}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: Idea['status'] }) {
  const config = {
    draft: { icon: Circle, label: 'Draft', className: 'text-muted-foreground' },
    'in-progress': { icon: Loader2, label: 'In Progress', className: 'text-blue-500' },
    completed: { icon: CheckCircle2, label: 'Completed', className: 'text-green-500' },
    archived: { icon: Archive, label: 'Archived', className: 'text-orange-500' },
  };
  const { icon: Icon, label, className } = config[status];
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Icon className="size-3" />
      {label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Idea['priority'] }) {
  const config = {
    low: { label: 'Low', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    high: { label: 'High', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };
  const { label, className } = config[priority];
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${className}`}>
      {label}
    </span>
  );
}
