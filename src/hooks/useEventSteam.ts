import { useEffect } from "react"
import { useDirectoryStore } from "@/stores"
import type { Event as OpencodeEvent } from "@opencode-ai/sdk/v2";
import { getEvent } from "@/lib/opencode"
import { handleEvent } from "@/events/eventRoute";

export function useEventStream() {
    const selectedDirectory = useDirectoryStore(s => s.selectedDirectory)

    // TODO replace with global event
    useEffect(() => {
        if (!selectedDirectory) {
            return;
        }

        const es = getEvent({ directory: selectedDirectory });

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
            es.close();
        };

        return () => {
            es.close();
        };
    }, [selectedDirectory]);
}