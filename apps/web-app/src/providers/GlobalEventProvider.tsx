import { getOcClient, handleEvent } from "@/lib/opencode";
import type { GlobalEvent } from "@opencode-ai/sdk/v2";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type ServerStatus = "PENDING" | "CONNETED" | "DISCONNECTED";

interface GlobalEventType {
  status: ServerStatus;
}

export const GlobalEventContext = createContext<GlobalEventType>({
  status: "PENDING",
});

interface GlobalEventProviderProps {
  children: ReactNode;
}

let nextId = 0;
export function GlobalEventProvider({ children }: GlobalEventProviderProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ServerStatus>("PENDING");

  const subscribe = async (
    id: number,
    onEvent: (event: GlobalEvent) => void,
    isCancelled: () => boolean,
  ) => {
    const oc = getOcClient();
    const { stream } = await oc.global.event();
    console.log(`[${id}] connected`);

    if (isCancelled()) {
      console.log(`[${id}] cancel because skip`);
      await stream.return(undefined);
      return;
    }

    for await (const event of stream) {
      onEvent(event);
    }

    return stream;
  };

  useEffect(() => {
    let heartbeatTimer: ReturnType<typeof setTimeout>;

    const resetHeartbeat = () => {
      clearTimeout(heartbeatTimer);

      heartbeatTimer = setTimeout(() => {
        setStatus("DISCONNECTED");
      }, 30000);
    };

    const id = ++nextId;
    let cancelled = false;
    let stream: AsyncGenerator<GlobalEvent> | undefined;

    void (async () => {
      stream = await subscribe(
        id,
        (event) => {
          resetHeartbeat();
          setStatus("CONNETED");

          handleEvent(event, queryClient);
        },
        () => cancelled,
      );
    })();

    return () => {
      console.log(`[${id}] unsub`);
      cancelled = true;
      void stream?.return(undefined);
    };
  }, [queryClient]);

  return (
    <GlobalEventContext.Provider value={{ status }}>
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
