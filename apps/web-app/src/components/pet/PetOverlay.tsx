import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { X } from "lucide-react";
import { petTriggerLabel, usePetActivity } from "@/hooks/usePetActivity";
import { petBridge } from "@/lib/desktop/petBridge";
import type { RecentChatSession } from "@/types";
import { PetActivityList } from "./PetActivityList";
import { PetSprite } from "./PetSprite";
import { openSessionTab } from "./openSessionTab";

const COLLAPSED_SIZE = { width: 144, height: 160 };
const EXPANDED_SIZE = { width: 448, height: 384 };
const SPRITE_MARGIN = 12; // px — mirrors the right-3/bottom-3 utilities
const SPRITE_SIZE = 96; // px — mirrors the size-24 utility
const PANEL_GAP = 8; // px between the panel and the sprite
const DRAG_THRESHOLD = 2; // px before a pointer gesture counts as a drag

/**
 * Desktop overlay pet, rendered by the `/pet` route inside the Electron pet
 * window. The sprite sits at the bottom-right of a small transparent window;
 * clicking it expands the activity panel up-and-left (the Electron side keeps
 * the bottom-right corner anchored on `setSize`). Dragging moves the whole
 * window through the pet bridge. In a plain browser the bridge is a no-op, so
 * this renders harmlessly.
 */
export function PetOverlay() {
  const [expanded, setExpanded] = useState(false);
  const dragging = useRef(false);
  const didDrag = useRef(false);
  const lastScreen = useRef<{ x: number; y: number } | undefined>(undefined);
  const {
    records,
    petState,
    waitingCount,
    workingCount,
    isLoading,
    error,
    workspaces,
  } = usePetActivity();

  useEffect(() => {
    const size = expanded ? EXPANDED_SIZE : COLLAPSED_SIZE;
    petBridge.setSize(size.width, size.height);
  }, [expanded]);

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    dragging.current = true;
    didDrag.current = false;
    lastScreen.current = { x: event.screenX, y: event.screenY };
    petBridge.dragStart();
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!dragging.current) return;
    const last = lastScreen.current;
    if (
      last &&
      (Math.abs(event.screenX - last.x) > DRAG_THRESHOLD ||
        Math.abs(event.screenY - last.y) > DRAG_THRESHOLD)
    ) {
      didDrag.current = true;
    }
    lastScreen.current = { x: event.screenX, y: event.screenY };
    petBridge.dragMove(event.screenX, event.screenY);
  };

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    lastScreen.current = undefined;
    petBridge.dragEnd();
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const handleOpenSession = (session: RecentChatSession) => {
    petBridge.openSession(openSessionTab(session, workspaces));
    petBridge.focusMain();
    setExpanded(false);
  };

  const triggerLabel = petTriggerLabel(waitingCount, workingCount);

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <button
        type="button"
        aria-label={triggerLabel}
        data-pet-state={petState}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={(event) => {
          event.preventDefault();
          petBridge.showContextMenu();
        }}
        onClick={(event) => {
          if (didDrag.current) {
            event.preventDefault();
            didDrag.current = false;
            return;
          }
          setExpanded((current) => !current);
        }}
        className="absolute right-3 bottom-3 z-10 flex size-24 touch-none cursor-grab items-center justify-center rounded-xl bg-transparent select-none active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <PetSprite state={petState} />
      </button>

      {expanded && (
        <section
          data-pet-panel
          className="absolute bottom-3 z-20 flex w-80 flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg outline-hidden"
          style={{ right: SPRITE_MARGIN + SPRITE_SIZE + PANEL_GAP }}
        >
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="flex touch-none cursor-grab items-center justify-between gap-2 border-b px-3 py-2 active:cursor-grabbing"
          >
            <span className="text-sm font-semibold">Agent activity</span>
            <button
              type="button"
              aria-label="Close agent activity"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setExpanded(false)}
              className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X data-icon className="size-3.5" />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <PetActivityList
              isLoading={isLoading}
              error={error}
              records={records}
              workspaces={workspaces}
              onOpenSession={handleOpenSession}
            />
          </div>
        </section>
      )}
    </div>
  );
}
