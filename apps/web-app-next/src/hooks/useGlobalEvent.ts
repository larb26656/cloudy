import { useEffect, useRef } from "react";
import { subscribe, type GlobalEventCallback, type StatusCallback } from "@/lib/globalEventBus";

export type { GlobalEventCallback, StatusCallback };

export function useGlobalEvent(
  onEvent: GlobalEventCallback,
  onStatus?: StatusCallback
): void {
  const onEventRef = useRef(onEvent);
  const onStatusRef = useRef(onStatus);

  onEventRef.current = onEvent;
  onStatusRef.current = onStatus;

  useEffect(() => {
    const unsubscribe = subscribe(onEventRef.current, onStatusRef.current);
    return unsubscribe;
  }, []);
}
