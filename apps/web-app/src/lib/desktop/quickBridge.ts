import type { SessionTabPayload } from "@/components/pet/openSessionTab";

export interface QuickBridgeApi {
  hide(): void;
  openSession(payload: SessionTabPayload): void;
  onFocusInput(callback: () => void): () => void;
}

export const quickBridge: QuickBridgeApi = {
  hide: () => window.__CLOUDY_DESKTOP__?.quickBridge?.hide(),
  openSession: (payload) =>
    window.__CLOUDY_DESKTOP__?.quickBridge?.openSession(payload),
  onFocusInput: (callback) =>
    window.__CLOUDY_DESKTOP__?.quickBridge?.onFocusInput(callback) ??
    (() => {}),
};
