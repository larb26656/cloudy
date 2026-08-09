import { useCallback, useEffect, useState } from "react";

export type InteractionMode = "select" | "hand";

/**
 * Manages the desk canvas interaction mode (Select vs Hand/Pan).
 *
 * Two layers compose into the final behavior:
 *  - `mode` is the sticky tool selected via the toolbar or the V/H shortcuts.
 *  - `spaceHeld` is a transient override — while Space is held, the behavior
 *    flips to the opposite of the sticky mode (Select↔Hand), matching Figma.
 *
 * The derived `isHand` is what the React Flow props (`panOnDrag` /
 * `selectionOnDrag`) consume.
 *
 * Keyboard guards skip activation while the user is typing in a form field or
 * contenteditable (chat-node, sticky-note, mermaid editor), and while a modifier
 * key is held so V/H don't shadow Cmd+V / Cmd+H etc.
 */
export function useInteractionMode() {
  const [mode, setMode] = useState<InteractionMode>("select");
  const [spaceHeld, setSpaceHeld] = useState(false);

  const isHand = spaceHeld ? mode === "select" : mode === "hand";

  useEffect(() => {
    const isFormField = (e: KeyboardEvent): boolean => {
      const target = e.target as HTMLElement | null;
      if (!target) return false;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT")
        return true;
      return target.isContentEditable;
    };

    const hasModifier = (e: KeyboardEvent): boolean =>
      e.metaKey || e.ctrlKey || e.altKey;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (isFormField(e) || hasModifier(e)) return;

      if (e.code === "Space") {
        e.preventDefault();
        setSpaceHeld(true);
        return;
      }
      if (e.code === "KeyV") {
        setMode("select");
        return;
      }
      if (e.code === "KeyH") {
        setMode("hand");
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setSpaceHeld(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const selectMode = useCallback((next: InteractionMode) => {
    setMode(next);
  }, []);

  return { mode, setMode: selectMode, isHand, spaceHeld };
}
