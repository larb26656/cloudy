import { useEffect, useState, useMemo, useCallback } from "react";
import { Plus, FileText, Search } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { useMemoryUIStore } from "@/features/memory/store/memoryStore";
import { Header } from "@/components/layout";
import { apiResponseToMemory } from "@/features/memory/api";
import { stringifyFrontMatter } from "@/lib/front-matter";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@cloudy/ui";
import { Skeleton } from "@cloudy/ui";
import type { Memory } from "@/features/memory/types";
import {
  CreateMemoryDialog,
  MemoryCard,
  MemoryDetailSheet,
} from "./components";

export default function MemoryPage() {
  const { searchQuery, setSearchQuery, selectedMemoryId, selectMemory } =
    useMemoryUIStore();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMemories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await apiClient.api.memory.get({ query: { order: 'updatedAt:desc' } });
      if (apiError) {
        const message =
          typeof apiError.value === "string"
            ? apiError.value
            : apiError.value?.message || "Failed to load memories";
        setError(message);
        setMemories([]);
        return;
      }
      setMemories((data || []).map(apiResponseToMemory));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load memories";
      setError(message);
      setMemories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const createMemory = useCallback(
    (memoryData: Omit<Memory, "id" | "meta">) => {
      const now = new Date().toISOString();
      const meta: Memory["meta"] = {
        title: memoryData.name,
        tags: [],
        createdAt: now,
        updatedAt: now,
      };

      const markdown = stringifyFrontMatter(
        meta,
        memoryData.description || memoryData.name,
      );

      const newMemory: Memory = {
        id: crypto.randomUUID(),
        name: memoryData.name,
        description: memoryData.description || "",
        markdown,
        meta,
      };

      setMemories((prev) => [newMemory, ...prev]);
      return newMemory;
    },
    [],
  );

  const deleteMemory = useCallback(
    (id: string) => {
      setMemories((prev) => prev.filter((m) => m.id !== id));
      if (selectedMemoryId === id) selectMemory(null);
    },
    [selectedMemoryId, selectMemory],
  );

  const filteredMemories = useMemo(() => {
    if (!searchQuery.trim()) return memories;
    const query = searchQuery.toLowerCase();
    return memories.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        m.meta.title?.toLowerCase().includes(query) ||
        m.meta.tags.some((t) => t.toLowerCase().includes(query)),
    );
  }, [memories, searchQuery]);

  const selectedMemory = memories.find((m) => m.id === selectedMemoryId);

  const handleCreate = (memoryData: Parameters<typeof createMemory>[0]) => {
    const newMemory = createMemory(memoryData);
    selectMemory(newMemory.id);
  };

  return (
    <>
      <div className="flex h-screen flex-col">
        {/* Header */}
        <Header title="Memories" showRefresh={false} />

        {/* Search + Filter */}
        <div className="flex flex-col gap-2 border-b p-4">
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <InputGroupAddon align="inline-end">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSearchQuery("")}
                >
                  ×
                </Button>
              </InputGroupAddon>
            )}
          </InputGroup>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto">
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-32 w-full rounded-xl" />
                  </div>
                ))}
              </>
            ) : error ? (
              <div className="col-span-full">
                <ErrorState message={error} onRetry={loadMemories} />
              </div>
            ) : filteredMemories.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <FileText className="size-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No memories found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Create your first memory to get started"}
                </p>
                {!searchQuery && (
                  <Button className="mt-4" onClick={() => {}}>
                    <Plus className="mr-2 size-4" />
                    Create Memory
                  </Button>
                )}
              </div>
            ) : (
              filteredMemories.map((memory) => (
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
        </div>
      </div>
      <MemoryDetailSheet
        memory={selectedMemory || null}
        onClose={() => selectMemory(null)}
      />

      <CreateMemoryDialog
        open={false}
        onOpenChange={() => {}}
        onCreate={handleCreate}
      />
    </>
  );
}
