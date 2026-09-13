import { useEffect, useState } from "react";

type UseElapsedTimeOptions = {
  start: number;
  active: boolean;
};

export function useElapsedTime({
  start,
  active,
}: UseElapsedTimeOptions): number {
  const [elapsed, setElapsed] = useState(() =>
    Math.max(0, Math.floor((Date.now() - start) / 1000)),
  );

  useEffect(() => {
    if (!active) return;
    const updateElapsed = () =>
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    updateElapsed();
    const id = setInterval(updateElapsed, 1000);
    return () => clearInterval(id);
  }, [start, active]);

  return elapsed;
}
