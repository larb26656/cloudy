export type CycleDirection = "next" | "prev";

/**
 * Returns the next (or previous) name in a list, wrapping around.
 *
 * - Empty list returns `null`.
 * - When `current` is `null` or not found in `names`, `"next"` returns the
 *   first item and `"prev"` returns the last.
 */
export function getNextName(
  names: string[],
  current: string | null,
  direction: CycleDirection,
): string | null {
  if (names.length === 0) return null;

  const currentIndex = current ? names.indexOf(current) : -1;

  if (direction === "next") {
    const nextIndex =
      currentIndex === -1 || currentIndex === names.length - 1
        ? 0
        : currentIndex + 1;
    return names[nextIndex] ?? null;
  }

  const prevIndex = currentIndex <= 0 ? names.length - 1 : currentIndex - 1;
  return names[prevIndex] ?? null;
}
