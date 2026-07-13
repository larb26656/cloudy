import { useEffect, useRef, type ReactNode } from "react";

interface IsVisibleProps {
  onVisible: () => void;
  rootMargin?: string;
  threshold?: number;
  enabled?: boolean;
  children?: ReactNode;
}

export function IsVisible({
  onVisible,
  rootMargin = "200px",
  threshold = 0,
  enabled = true,
  children,
}: IsVisibleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onVisibleRef = useRef(onVisible);

  useEffect(() => {
    onVisibleRef.current = onVisible;
  }, [onVisible]);

  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onVisibleRef.current();
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, rootMargin, threshold]);

  return <div ref={ref}>{children}</div>;
}
