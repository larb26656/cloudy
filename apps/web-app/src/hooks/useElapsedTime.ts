import { useEffect, useState } from "react";

type UseElapsedTimeOptions = {
  start: number;
  active: boolean;
};

export function useElapsedTime({
  start,
  active,
}: UseElapsedTimeOptions): number {
  const compute = () => Math.max(0, Math.floor((Date.now() - start) / 1000));
  const [elapsed, setElapsed] = useState(compute);

  useEffect(() => {
    if (!active) return;
    setElapsed(compute());
    const id = setInterval(() => setElapsed(compute()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, active]);

  return elapsed;
}
