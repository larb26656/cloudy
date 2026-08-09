import { useEffect, useState } from "react";

/**
 * Tracks whether the window is focused and visible.
 *
 * Combines two native signals so all "user is back" cases are covered:
 * - `visibilitychange` / `document.hidden` — switching browser tabs back.
 * - `focus` / `blur` on `window` — switching OS windows back without a tab change.
 *
 * Returns `true` only when `document.hasFocus() && !document.hidden`.
 */
export function useWindowFocus(): boolean {
  const [focused, setFocused] = useState(() =>
    typeof document === "undefined"
      ? true
      : document.hasFocus() && !document.hidden,
  );

  useEffect(() => {
    const update = () => setFocused(document.hasFocus() && !document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    window.addEventListener("focus", update);
    window.addEventListener("blur", update);
    return () => {
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("focus", update);
      window.removeEventListener("blur", update);
    };
  }, []);

  return focused;
}
