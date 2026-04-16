import { useEffect } from "react"
import { useWorkspaceStore } from "@/stores/workspaceStore"
import type { Event as OpencodeEvent } from "@opencode-ai/sdk/v2";
import { getEvent } from "@/lib/opencode"
import { handleEvent } from "@/events/eventRoute";
import { useInstanceStore, type Instance } from "@/stores/instanceStore";

export function connectEvent(instance: Instance, directory: string) {
    const es: EventSource = getEvent({ directory });

    es.onmessage = (event: MessageEvent<string>) => {
        try {
            const opencodeEvent: OpencodeEvent = JSON.parse(event.data);
            handleEvent(opencodeEvent, instance.id);
        } catch (e) {
            console.error("parse error:", e);
        }
    };

    es.onerror = (err) => {
        console.error("SSE error:", err);
        es?.close();
    };

    return es;
}

export function createConnection(instance: Instance, directory: string) {
    let es: EventSource | null = null;

    const connect = () => {
        es = connectEvent(instance, directory);
    };

    const handleVisibility = () => {
        if (document.visibilityState === "visible") {
            es?.close();
            connect();
        }
    };

    const dispose = () => {
        document.removeEventListener("visibilitychange", handleVisibility);
        es?.close();
    };

    connect();

    document.addEventListener("visibilitychange", handleVisibility);

    return {
        dispose
    };
}

export function useEventStream() {
    const { workspaces } = useWorkspaceStore();
    const { getInstance, instances } = useInstanceStore();

    useEffect(() => {
        const connections = workspaces
            .map((workspace) => {
                const instance = getInstance(workspace.instanceId);
                if (!instance) return null;

                return createConnection(instance, workspace.directory);
            })
            .filter((connection) => connection !== null);

        return () => { connections.forEach(connection => connection.dispose()) }
    }, [instances, workspaces]);
}
