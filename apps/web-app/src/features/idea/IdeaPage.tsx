import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Lightbulb, Search } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { useIdeaUIStore } from "@/features/idea/store/ideaStore";

import {
  IdeaCard,
  IdeaDetailDialog,
  CREATE_IDEA_ID,
} from "@/features/idea/components";
import { Header } from "@/components/layout";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { TabGroupButton } from "@/components/ui/tab-group-button";
import type { IdeaModel } from "@cloudy/contracts";
import type { Idea, IdeaDetail } from "@/features/idea/types";
import { apiResponseToIdeaListItem } from "./types";
import { SidebarToggle } from "@/components/layout/SidebarToggle";

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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [inputValue, setInputValue] = useState(searchQuery);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const openIdeaId = isCreating ? CREATE_IDEA_ID : selectedIdeaId;

  const loadIdeas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query: IdeaModel["querySchema"] = {
        order: "updatedAt:desc",
      };
      if (searchQuery.trim()) {
        query.q = searchQuery.trim();
      }
      if (filterStatus !== "all") {
        query.status = filterStatus;
      }
      const { data, error: apiError } = await apiClient.api.idea.get({
        query,
      });
      if (apiError) {
        const message =
          typeof apiError.value === "string"
            ? apiError.value
            : apiError.value?.message || "Failed to load ideas";
        setError(message);
        setIdeas([]);
        toast.error(message);
        return;
      }
      setIdeas((data || []).map(apiResponseToIdeaListItem));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load ideas";
      setError(message);
      setIdeas([]);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filterStatus]);

  useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

  const handleDeleteClick = useCallback((id: string, name: string) => {
    setDeleteConfirmDialog({ id, name });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirmDialog) return;
    try {
      const { error: apiError } = await (apiClient.api.idea as any)[
        deleteConfirmDialog.id
      ].delete();
      if (apiError) {
        const message =
          typeof apiError === "string"
            ? apiError
            : apiError?.message || "Failed to delete idea";
        toast.error(message);
        return;
      }
      setIdeas((prev) => prev.filter((i) => i.id !== deleteConfirmDialog.id));
      if (selectedIdeaId === deleteConfirmDialog.id) selectIdea(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete idea");
    } finally {
      setDeleteConfirmDialog(null);
    }
  }, [deleteConfirmDialog, selectedIdeaId, selectIdea]);

  const handleIdeaCreated = useCallback(
    (created: IdeaDetail) => {
      setIsCreating(false);
      loadIdeas();
      selectIdea(created.id);
    },
    [loadIdeas, selectIdea],
  );

  const handleCreateClick = useCallback(() => {
    setIsCreating(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsCreating(false);
    selectIdea(null);
  }, [selectIdea]);

  return (
    <>
      <div className="flex h-screen flex-col">
        <Header
          prefixActions={[<SidebarToggle />]}
          title="Ideas"
          actions={[
            <Button
              variant={"ghost"}
              size="icon-sm"
              onClick={handleCreateClick}
            >
              <Plus />
            </Button>,
          ]}
        />

        <div className="flex flex-col gap-2 border-b p-4">
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search ideas..."
              value={inputValue}
              onChange={(e) => {
                const value = e.target.value;
                setInputValue(value);
                if (debounceRef.current) {
                  clearTimeout(debounceRef.current);
                }
                debounceRef.current = setTimeout(() => {
                  setSearchQuery(value);
                }, 300);
              }}
            />
            {inputValue && (
              <InputGroupAddon align="inline-end">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setInputValue("");
                    setSearchQuery("");
                    if (debounceRef.current) {
                      clearTimeout(debounceRef.current);
                    }
                  }}
                >
                  ×
                </Button>
              </InputGroupAddon>
            )}
          </InputGroup>
          <TabGroupButton
            options={filterOptions}
            value={filterStatus}
            onChange={setFilterStatus}
          />
        </div>

        <div className="flex-1 overflow-auto">
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
            ) : ideas.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <Lightbulb className="size-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No ideas found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchQuery || filterStatus !== "all"
                    ? "Try adjusting your filters"
                    : "Capture your first idea to get started"}
                </p>
                {!searchQuery && filterStatus === "all" && (
                  <Button className="mt-4" onClick={handleCreateClick}>
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
                  onDelete={() => handleDeleteClick(idea.id, idea.name)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <IdeaDetailDialog
        ideaId={openIdeaId}
        onClose={handleCloseDialog}
        onIdeaUpdated={loadIdeas}
        onIdeaCreated={handleIdeaCreated}
      />

      <DeleteConfirmDialog
        item={deleteConfirmDialog}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmDialog(null)}
      />
    </>
  );
}
