import type { SessionTabPayload } from "@/components/pet/openSessionTab";

/**
 * Bridge between the `/pet` overlay window and the Electron main process.
 * The real implementation is injected by the desktop preload as
 * `window.__CLOUDY_DESKTOP__.petBridge`; in a plain browser every method
 * falls back to a no-op so the `/pet` route renders harmlessly.
 */
export interface PetBridgeApi {
  /** Begin a window drag gesture (mouse-down on the pet). */
  dragStart(): void;
  /**
   * Move the window during a drag. Coordinates are **screen-space** pointer
   * positions (`event.screenX`/`event.screenY`); the main process derives
   * the window delta from the cursor delta.
   */
  dragMove(screenX: number, screenY: number): void;
  /** End a window drag gesture (mouse-up). */
  dragEnd(): void;
  /**
   * Resize the overlay window. The main process keeps the bottom-right
   * corner anchored (the panel grows up-and-left).
   */
  setSize(width: number, height: number): void;
  /** Focus and raise the main window. */
  focusMain(): void;
  /** Relay a session-tab payload to the main window. */
  openSession(payload: SessionTabPayload): void;
  /**
   * Subscribe to session-tab payloads sent by the pet window. Returns an
   * unsubscribe function.
   */
  onOpenSession(callback: (payload: SessionTabPayload) => void): () => void;
  /** Open the native context menu on the pet overlay (hide pet, ...). */
  showContextMenu(): void;
  /** Show the hidden pet overlay window again. */
  show(): void;
  /** Resolve whether the pet overlay window is currently visible. */
  getVisibility(): Promise<boolean>;
  /**
   * Subscribe to pet overlay visibility changes (hidden via its context
   * menu, restored via `show`). Returns an unsubscribe function.
   */
  onVisibility(callback: (visible: boolean) => void): () => void;
}

const noop = (): void => {};

const noopUnsubscribe: () => void = noop;

export const petBridge: PetBridgeApi = {
  dragStart: () => window.__CLOUDY_DESKTOP__?.petBridge?.dragStart(),
  dragMove: (screenX, screenY) =>
    window.__CLOUDY_DESKTOP__?.petBridge?.dragMove(screenX, screenY),
  dragEnd: () => window.__CLOUDY_DESKTOP__?.petBridge?.dragEnd(),
  setSize: (width, height) =>
    window.__CLOUDY_DESKTOP__?.petBridge?.setSize(width, height),
  focusMain: () => window.__CLOUDY_DESKTOP__?.petBridge?.focusMain(),
  openSession: (payload) =>
    window.__CLOUDY_DESKTOP__?.petBridge?.openSession(payload),
  onOpenSession: (callback) =>
    window.__CLOUDY_DESKTOP__?.petBridge?.onOpenSession(callback) ??
    noopUnsubscribe,
  showContextMenu: () =>
    window.__CLOUDY_DESKTOP__?.petBridge?.showContextMenu(),
  show: () => window.__CLOUDY_DESKTOP__?.petBridge?.show(),
  getVisibility: () =>
    window.__CLOUDY_DESKTOP__?.petBridge?.getVisibility() ??
    Promise.resolve(true),
  onVisibility: (callback) =>
    window.__CLOUDY_DESKTOP__?.petBridge?.onVisibility(callback) ??
    noopUnsubscribe,
};
