import { useEffect, useState, useMemo, useCallback } from "react";
import { FileCode, Search } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import {
  useArtifactUIStore,
  filterArtifacts,
} from "@/features/artifact/store/artifactStore";
import {
  ArtifactCard,
  ArtifactDetailSheet,
} from "@/features/artifact/components";
import { Header } from "@/components/layout";
import { apiResponseToArtifact } from "@/features/artifact/api";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { TabGroupButton } from "@/components/ui/tab-group-button";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import type { ArtifactModel } from "@cloudy/contracts";
import type { Artifact } from "@/features/artifact/types";
import { SidebarToggle } from "@/components/layout/SidebarToggle";

const filterOptions: Array<{
  value: ArtifactModel["artifactType"] | "all";
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "html", label: "HTML" },
  { value: "pdf", label: "PDF" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "document", label: "Document" },
];

export default function ArtifactPage() {
  const {
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    selectedArtifactId,
    selectArtifact,
  } = useArtifactUIStore();
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadArtifacts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await apiClient.api.artifact.get({
        query: { order: "updatedAt:desc" },
      });
      if (apiError) {
        const message =
          typeof apiError.value === "string"
            ? apiError.value
            : apiError.value?.message || "Failed to load artifacts";
        setError(message);
        setArtifacts([]);
        return;
      }
      setArtifacts((data || []).map(apiResponseToArtifact));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load artifacts";
      setError(message);
      setArtifacts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArtifacts();
  }, [loadArtifacts]);

  const deleteArtifact = useCallback(
    (id: string) => {
      setArtifacts((prev) => prev.filter((a) => a.id !== id));
      if (selectedArtifactId === id) selectArtifact(null);
    },
    [selectedArtifactId, selectArtifact],
  );

  const filteredArtifacts = useMemo(
    () => filterArtifacts(artifacts, searchQuery, filterType),
    [artifacts, searchQuery, filterType],
  );
  const selectedArtifact = artifacts.find((a) => a.id === selectedArtifactId);

  return (
    <>
      <div className="flex h-dvh flex-col">
        <Header prefixActions={[<SidebarToggle />]} title="Artifacts" />

        <div className="flex flex-col gap-2 border-b p-4">
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search artifacts..."
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
          <TabGroupButton
            options={filterOptions}
            value={filterType}
            onChange={setFilterType}
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
                <ErrorState message={error} onRetry={loadArtifacts} />
              </div>
            ) : filteredArtifacts.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <FileCode className="size-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No artifacts found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchQuery || filterType !== "all"
                    ? "Try adjusting your filters"
                    : "Artifacts you create will appear here"}
                </p>
              </div>
            ) : (
              filteredArtifacts.map((artifact) => (
                <ArtifactCard
                  key={artifact.id}
                  artifact={artifact}
                  isSelected={artifact.id === selectedArtifactId}
                  onSelect={() => selectArtifact(artifact.id)}
                  onDelete={() => deleteArtifact(artifact.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
      <ArtifactDetailSheet
        artifact={selectedArtifact || null}
        onClose={() => selectArtifact(null)}
      />
    </>
  );
}
