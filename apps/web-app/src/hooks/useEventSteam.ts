import { useEffect } from "react"
import { useStore } from "@/stores/instance"
import type { Event as OpencodeEvent } from "@opencode-ai/sdk/v2";
import { getEvent } from "@/lib/opencode"
import { handleEvent } from "@/events/eventRoute";

export function useEventStream() {
    const selectedDirectory = useStore("directory").selectedDirectory

    // TODO replace with global event
    useEffect(() => {
        if (!selectedDirectory) return;

        let es: EventSource | null = null;

        const connect = () => {
            es = getEvent({ directory: selectedDirectory });

            es.onmessage = (event: MessageEvent<string>) => {
                try {
                    const opencodeEvent: OpencodeEvent = JSON.parse(event.data);
                    handleEvent(opencodeEvent);
                } catch (e) {
                    console.error("parse error:", e);
                }
            };

            es.onerror = (err) => {
                console.error("SSE error:", err);
                es?.close();
            };
        };

        connect();

        // 👇 ถ้า user switch tab กลับมา
        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                // reconnect SSE
                es?.close();
                connect();
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibility);
            es?.close();
        };
    }, [selectedDirectory]);
}
