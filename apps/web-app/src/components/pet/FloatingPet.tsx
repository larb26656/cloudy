import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import { Cat, EyeOff, X } from "lucide-react";
import { isModeElectron } from "@/config/env";
import { petTriggerLabel, usePetActivity } from "@/hooks/usePetActivity";
import { useTabStore } from "@/stores/tabStore";
import type { RecentChatSession } from "@/types";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@repo/ui/components/popover";
import { PetActivityList } from "./PetActivityList";
import { PetSprite } from "./PetSprite";
import { openSessionTab } from "./openSessionTab";

type PetPosition = { left: number; top: number };

/**
 * In-window floating pet (browser mode). In Electron mode the desktop pet
 * overlay window owns the pet instead, so this renders nothing.
 */
export function FloatingPet() {
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PetPosition | null>(null);
  const drag = useRef<
    | {
        pointerId: number;
        offsetX: number;
        offsetY: number;
      }
    | undefined
  >(undefined);
  const didDrag = useRef(false);
  const {
    records,
    petState,
    waitingCount,
    workingCount,
    isLoading,
    error,
    workspaces,
  } = usePetActivity();
  const openTab = useTabStore((s) => s.openTab);

  if (isModeElectron) return null;

  const handleOpenSession = (session: RecentChatSession) => {
    const payload = openSessionTab(session, workspaces);
    openTab(payload.type, payload.data);
    setOpen(false);
  };

  const handleDismiss = () => {
    setOpen(false);
    setDismissed(true);
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    drag.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
    };
    didDrag.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const currentDrag = drag.current;
    if (currentDrag?.pointerId !== event.pointerId) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const left = Math.min(
      Math.max(12, event.clientX - currentDrag.offsetX),
      Math.max(12, window.innerWidth - bounds.width - 12),
    );
    const top = Math.min(
      Math.max(12, event.clientY - currentDrag.offsetY),
      Math.max(12, window.innerHeight - bounds.height - 12),
    );

    if (Math.abs(left - bounds.left) > 2 || Math.abs(top - bounds.top) > 2) {
      didDrag.current = true;
      setPosition({ left, top });
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (drag.current?.pointerId === event.pointerId) {
      drag.current = undefined;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
  };

  if (dismissed) {
    return (
      <button
        type="button"
        aria-label="Show pet"
        onClick={() => setDismissed(false)}
        className="fixed right-4 bottom-4 z-30 flex size-9 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Cat data-icon className="size-4" />
      </button>
    );
  }

  const triggerLabel = petTriggerLabel(waitingCount, workingCount);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={triggerLabel}
            data-pet-state={petState}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={(event) => {
              if (didDrag.current) {
                event.preventDefault();
                didDrag.current = false;
              }
            }}
            className="fixed right-3 bottom-3 z-30 flex size-16 touch-none cursor-grab items-center justify-center rounded-xl bg-transparent select-none active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:right-4 sm:bottom-4 sm:size-24"
            style={position ?? undefined}
          />
        }
      >
        <span className="relative block size-full">
          <PetSprite state={petState} />
        </span>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={8}
        className="w-80 gap-0 p-0"
      >
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
          <PopoverTitle className="text-sm font-semibold">
            Agent activity
          </PopoverTitle>
          <div className="flex items-center">
            <button
              type="button"
              aria-label="Hide pet"
              onClick={handleDismiss}
              className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <EyeOff data-icon className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Close agent activity"
              onClick={() => setOpen(false)}
              className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X data-icon className="size-3.5" />
            </button>
          </div>
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
      </PopoverContent>
    </Popover>
  );
}
