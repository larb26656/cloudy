import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Plus, Search, FileText, X } from 'lucide-react';
import { useMemoryStore } from '@/stores/memoryStore';
import { MemoryCard, CreateMemoryDialog } from '@/components/memory';
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

export const Route = createFileRoute('/_appMainLayout/memory')({
  component: MemoryPage,
});

function MemoryPage() {
  const {
    loadMemories,
    getFilteredMemories,
    selectedMemoryId,
    selectMemory,
    deleteMemory,
    createMemory,
    isLoading,
    searchQuery,
    setSearchQuery,
  } = useMemoryStore();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const memories = getFilteredMemories();
  const selectedMemory = memories.find((m) => m.id === selectedMemoryId);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const handleCreate = (memoryData: Parameters<typeof createMemory>[0]) => {
    const newMemory = createMemory(memoryData);
    selectMemory(newMemory.id);
  };

  return (
    <div className="flex h-full">
      <div className="flex flex-col flex-1 border-r">
        <div className="flex items-center gap-2 border-b p-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search memories..."
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

        <ScrollArea className="flex-1">
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-32 w-full rounded-xl" />
                  </div>
                ))}
              </>
            ) : memories.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <FileText className="size-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No memories found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : 'Create your first memory to get started'}
                </p>
                {!searchQuery && (
                  <Button
                    className="mt-4"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <Plus className="mr-2 size-4" />
                    Create Memory
                  </Button>
                )}
              </div>
            ) : (
              memories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  isSelected={memory.id === selectedMemoryId}
                  onSelect={() => selectMemory(memory.id)}
                  onDelete={() => deleteMemory(memory.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <Sheet open={!!selectedMemory} onOpenChange={(open) => !open && selectMemory(null)}>
        <SheetContent className="w-full sm:max-w-2xl">
          {selectedMemory && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <FileText className="size-5" />
                  {selectedMemory.name}
                </SheetTitle>
                <SheetDescription>
                  Created {new Intl.DateTimeFormat('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(new Date(selectedMemory.meta.createdAt))}
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="mt-6 h-[calc(100vh-12rem)]">
                <MarkdownRenderer content={selectedMemory.markdown} />
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      <CreateMemoryDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreate}
      />
    </div>
  );
}
