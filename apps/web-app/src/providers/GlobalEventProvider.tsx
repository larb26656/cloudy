import { useWindowFocus } from "@/hooks";
import { getOcClient, handleEvent } from "@/lib/opencode";
import type { GlobalEvent } from "@opencode-ai/sdk/v2";
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

interface GlobalEventProviderProps {
  children: ReactNode;
}

let nextId = 0;

export function GlobalEventProvider({ children }: GlobalEventProviderProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ServerStatus>("PENDING");
  const [reconnectTick, setReconnectTick] = useState(0);

  const reconnect = useCallback(() => {
    setStatus("PENDING");
    setReconnectTick((t) => t + 1);
  }, []);

  const focused = useWindowFocus();
  const prevFocused = useRef(focused);

  useEffect(() => {
    if (!prevFocused.current && focused && status === "DISCONNECTED") {
      reconnect();
    }
    prevFocused.current = focused;
  }, [focused, status, reconnect]);

  const subscribe = async (
    id: number,
    onEvent: (event: GlobalEvent) => void,
    isCancelled: () => boolean,
  ) => {
    const oc = getOcClient();
    const { stream } = await oc.global.event({
      sseMaxRetryAttempts: 5,
      sseMaxRetryDelay: 3000,
    });
    console.debug(`[${id}] connected`);

    if (isCancelled()) {
      console.debug(`[${id}] cancel because skip`);
      await stream.return(undefined);
      return;
    }

    for await (const event of stream) {
      onEvent(event);
    }

    if (!isCancelled()) {
      setStatus("DISCONNECTED");
    }

    return stream;
  };

  useEffect(() => {
    const id = ++nextId;
    let cancelled = false;
    let stream: AsyncGenerator<GlobalEvent> | undefined;

    void (async () => {
      stream = await subscribe(
        id,
        (event) => {
          setStatus("CONNETED");

          handleEvent(event, queryClient);
        },
        () => cancelled,
      );
    })();

    return () => {
      console.debug(`[${id}] unsub`);
      cancelled = true;
      void stream?.return(undefined);
    };
  }, [queryClient, reconnectTick]);

  return (
    <GlobalEventContext.Provider value={{ status, reconnect }}>
      {children}
    </GlobalEventContext.Provider>
  );
}

export function useGlobalEvent() {
  const context = useContext(GlobalEventContext);

  if (!context) {
    throw new Error("useGlobalEvent must be used within GlobalEventProvider");
  }

  return context;
}
