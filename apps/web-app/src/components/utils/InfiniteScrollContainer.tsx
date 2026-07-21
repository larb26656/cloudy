import { useRef, type ReactNode, type RefObject } from "react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

type PaginationConfig = {
  hasMore: boolean;
  isFetching: boolean;
  fetchMore: () => void;
};

interface InfiniteScrollContainerProps {
  children: ReactNode;
  prev?: PaginationConfig;
  next?: PaginationConfig;
  loadingComponent?: ReactNode;
  reverse?: boolean;
  rootMargin?: string;
  threshold?: number;
  enabled?: boolean;
  className?: string;
  scrollClassName?: string;
  scrollRef?: RefObject<HTMLDivElement | null>;
  onScroll?: React.UIEventHandler<HTMLDivElement>;
}

export function InfiniteScrollContainer({
  children,
  prev,
  next,
  loadingComponent = <div>Loading...</div>,
  reverse = false,
  className,
  scrollClassName,
  scrollRef,
  onScroll,
}: InfiniteScrollContainerProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = scrollRef ?? internalRef;

  const topSection = reverse ? next : prev;
  const bottomSection = reverse ? prev : next;

  return (
    <div
      ref={ref}
      className={cn("overflow-y-auto h-full", scrollClassName)}
      onScroll={onScroll}
    >
      <div className={cn("p-4 h-full flex flex-col gap-4", className)}>
        {topSection && (
          <div className="self-center">
            {topSection.hasMore && !topSection.isFetching && (
              <Button onClick={topSection.fetchMore}>
                Load more {topSection.hasMore}
              </Button>
            )}
            {topSection.isFetching && loadingComponent}
          </div>
        )}

        <div>{children}</div>

        {bottomSection && (
          <div className="self-center">
            {bottomSection.hasMore && !bottomSection.isFetching && (
              <Button onClick={bottomSection.fetchMore}>Load more</Button>
            )}
            {bottomSection.isFetching && loadingComponent}
          </div>
        )}
      </div>
    </div>
  );
}
