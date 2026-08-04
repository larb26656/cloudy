import { LoadingState } from "@/components/ui/loading-state";

type InfiniteScrollTriggerProps = {
  enabled: boolean;
  isLoading?: boolean;
  sentinelRef: (node: HTMLDivElement | null) => void;
};

export function InfiniteScrollTrigger({
  enabled,
  isLoading = false,
  sentinelRef,
}: InfiniteScrollTriggerProps) {
  if (!enabled && !isLoading) return null;

  return (
    <>
      {enabled && <div ref={sentinelRef} className="h-4 w-full" />}

      {isLoading && (
        <LoadingState
          size="inline"
          title={null}
          spinner={
            <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          }
        />
      )}
    </>
  );
}
