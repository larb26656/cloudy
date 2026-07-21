import { useRef, type ReactNode, type RefObject } from "react";
import { Button } from "../ui/button";
import { IsVisible } from "./IsVisible";
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
  autoLoad?: boolean;
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
  autoLoad = false,
  className,
  scrollClassName,
  scrollRef,
  onScroll,
}: InfiniteScrollContainerProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = scrollRef ?? internalRef;

  const topSection = reverse ? next : prev;
  const bottomSection = reverse ? prev : next;

  const renderSection = (section: PaginationConfig) => (
    <div className="self-center">
      {section.hasMore &&
        !section.isFetching &&
        (autoLoad ? (
          <IsVisible onVisible={section.fetchMore} />
        ) : (
          <Button onClick={section.fetchMore} variant={"secondary"}>
            Load more
          </Button>
        ))}
      {section.isFetching && loadingComponent}
    </div>
  );

  return (
    <div
      ref={ref}
      className={cn("overflow-y-auto h-full", scrollClassName)}
      onScroll={onScroll}
    >
      <div className={cn("p-4 h-full flex flex-col gap-4", className)}>
        {topSection && renderSection(topSection)}

        <div>{children}</div>

        {bottomSection && renderSection(bottomSection)}
      </div>
    </div>
  );
}
