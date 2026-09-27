import { useWindowFocus } from "@/hooks";
import { env } from "@/config/env";
import { joinUrl } from "@/lib/url";
import { handleEvent } from "@/lib/opencode";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ServerStatus = "PENDING" | "CONNETED" | "DISCONNECTED";

interface GlobalEventType {
  status: ServerStatus;
  reconnect: () => void;
}

export const GlobalEventContext = createContext<GlobalEventType>({
  status: "PENDING",
  reconnect: () => {},
});

let nextId = 0;

async function consumeEvents(
  response: Response,
  onEvent: (event: unknown) => void,
  signal: AbortSignal,
) {
  if (!response.ok || !response.body)
    throw new Error(`Provider event stream failed: ${response.status}`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (!signal.aborted) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const data = frame
        .split("\n")
        .find((line) => line.startsWith("data:"))
        ?.slice(5)
        .trim();
      if (data) onEvent(JSON.parse(data));
    }
  }
  await reader.cancel();
}

export function GlobalEventProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ServerStatus>("PENDING");
  const [reconnectTick, setReconnectTick] = useState(0);
  const reconnect = useCallback(() => {
    setStatus("PENDING");
    setReconnectTick((tick) => tick + 1);
  }, []);
  const focused = useWindowFocus();
  const prevFocused = useRef(focused);

  useEffect(() => {
    if (!prevFocused.current && focused && status === "DISCONNECTED")
      reconnect();
    prevFocused.current = focused;
  }, [focused, reconnect, status]);

  useEffect(() => {
    const id = ++nextId;
    const controller = new AbortController();
    let cancelled = false;
    void fetch(joinUrl(env.getApiUrl(), "/api/providers/opencode/events"), {
      headers: { Accept: "text/event-stream" },
      signal: controller.signal,
    })
      .then((response) =>
        consumeEvents(
          response,
          (event) => {
            if (cancelled) return;
            if (
              typeof event === "object" &&
              event !== null &&
              "type" in event
            ) {
              if (event.type === "connected") {
                setStatus("CONNETED");
                return;
              }
              if (event.type === "heartbeat") return;
            }
            setStatus("CONNETED");
            handleEvent(
              event as Parameters<typeof handleEvent>[0],
              queryClient,
            );
          },
          controller.signal,
        ),
      )
      .catch(() => {
        if (!cancelled) setStatus("DISCONNECTED");
      })
      .finally(() => {
        if (!cancelled) setStatus("DISCONNECTED");
      });
    return () => {
      cancelled = true;
      controller.abort();
      void id;
    };
  }, [queryClient, reconnectTick]);

  return (
    <GlobalEventContext.Provider value={{ status, reconnect }}>
      {children}
    </GlobalEventContext.Provider>
  );
}

export function useGlobalEvent() {
  return useContext(GlobalEventContext);
}
