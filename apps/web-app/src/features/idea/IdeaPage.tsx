import { useEffect, useState, useMemo, useCallback } from "react";
import { Plus, Search, Lightbulb, X } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { useIdeaUIStore, filterIdeas } from "@/features/idea/store/ideaStore";
import {
  IdeaCard,
  CreateIdeaDialog,
  IdeaDetailSheet,
} from "@/features/idea/components";
import { Header } from "@/components/layout";
import { apiResponseToIdea } from "@/features/idea/api";
import { stringifyIdeaFrontMatter } from "@/lib/front-matter";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { IdeaModel } from "@cloudy/contracts";
import type { Idea } from "@/features/idea/types";

const filterOptions: Array<{
  value: IdeaModel["ideaStatus"] | "all";
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export default function IdeaPage() {
  const {
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    selectedIdeaId,
    selectIdea,
  } = useIdeaUIStore();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadIdeas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await api.idea.get();
      if (apiError) {
        const message =
          typeof apiError.value === "string"
            ? apiError.value
            : apiError.value?.message || "Failed to load ideas";
        setError(message);
        setIdeas([]);
        return;
      }
      setIdeas((data || []).map(apiResponseToIdea));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load ideas";
      setError(message);
      setIdeas([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

  const createIdea = useCallback((ideaData: Omit<Idea, "id" | "meta">) => {
    const now = new Date().toISOString();
    const meta: Idea["meta"] = {
      title: ideaData.name,
      tags: [],
      status: "draft",
      priority: "medium",
      createdAt: now,
      updatedAt: now,
    };

    const markdown = stringifyIdeaFrontMatter(
      meta,
      ideaData.description || ideaData.name,
    );

    const newIdea: Idea = {
      id: crypto.randomUUID(),
      name: ideaData.name,
      description: ideaData.description || "",
      markdown,
      meta,
    };

    setIdeas((prev) => [newIdea, ...prev]);
    return newIdea;
  }, []);

  const deleteIdea = useCallback(
    (id: string) => {
      setIdeas((prev) => prev.filter((i) => i.id !== id));
      if (selectedIdeaId === id) selectIdea(null);
    },
    [selectedIdeaId, selectIdea],
  );

  const filteredIdeas = useMemo(
    () => filterIdeas(ideas, searchQuery, filterStatus),
    [ideas, searchQuery, filterStatus],
  );
  const selectedIdea = ideas.find((i) => i.id === selectedIdeaId);

  const handleCreate = (ideaData: Parameters<typeof createIdea>[0]) => {
    const newIdea = createIdea(ideaData);
    selectIdea(newIdea.id);
  };

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Ideas"
        rightSlot={
          <Button onClick={() => {}}>
            <Plus className="mr-2 size-4" />
            New
          </Button>
        }
        showRefresh={false}
      />
      <div className="flex flex-col flex-1 border-t">
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
                  onClick={() => setSearchQuery("")}
                >
                  <X className="size-3" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                variant={filterStatus === option.value ? "default" : "ghost"}
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
            ) : error ? (
              <div className="col-span-full">
                <ErrorState message={error} onRetry={loadIdeas} />
              </div>
            ) : filteredIdeas.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <Lightbulb className="size-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No ideas found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchQuery || filterStatus !== "all"
                    ? "Try adjusting your filters"
                    : "Capture your first idea to get started"}
                </p>
                {!searchQuery && filterStatus === "all" && (
                  <Button className="mt-4" onClick={() => {}}>
                    <Plus className="mr-2 size-4" />
                    Create Idea
                  </Button>
                )}
              </div>
            ) : (
              filteredIdeas.map((idea) => (
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

      <IdeaDetailSheet
        idea={selectedIdea || null}
        onClose={() => selectIdea(null)}
      />

      <CreateIdeaDialog
        open={false}
        onOpenChange={() => {}}
        onCreate={handleCreate}
      />
    </div>
  );
}
