import { useCallback, useRef } from "react";

type UseInfiniteScrollOptions = {
    enabled?: boolean;
    onLoadMore: () => void;
    rootMargin?: string;
    threshold?: number;
};

export function useInfiniteScroll({
    enabled = true,
    onLoadMore,
    rootMargin = "0px 0px 100px 0px",
    threshold = 0,
}: UseInfiniteScrollOptions) {
    const observerRef = useRef<IntersectionObserver | null>(null);

    const sentinelRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }

            if (!node || !enabled) return;

            const scrollParent = node.closest(".overflow-y-auto") ?? null;

            observerRef.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0]?.isIntersecting) {
                        onLoadMore();
                    }
                },
                {
                    root: scrollParent,
                    rootMargin,
                    threshold,
                },
            );

            observerRef.current.observe(node);
        },
        [enabled, onLoadMore, rootMargin, threshold],
    );

    return sentinelRef;
}