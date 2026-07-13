import { useRef, type ReactNode, type RefObject } from "react";
import { IsVisible } from "./IsVisible";

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
  rootMargin = "200px",
  threshold = 0,
  enabled = true,
  className,
  scrollClassName,
  scrollRef,
  onScroll,
}: InfiniteScrollContainerProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = scrollRef ?? internalRef;

  return (
    <div className={className}>
      {prev && (
        <>
          {prev.hasMore && !prev.isFetching && (
            <IsVisible
              onVisible={prev.fetchMore}
              rootMargin={rootMargin}
              threshold={threshold}
              enabled={enabled}
            />
          )}
          {prev.isFetching && loadingComponent}
        </>
      )}

      <div ref={ref} className={scrollClassName} onScroll={onScroll}>
        {children}
      </div>

      {next && (
        <>
          {next.hasMore && !next.isFetching && (
            <IsVisible
              onVisible={next.fetchMore}
              rootMargin={rootMargin}
              threshold={threshold}
              enabled={enabled}
            />
          )}
          {next.isFetching && loadingComponent}
        </>
      )}
    </div>
  );
}
