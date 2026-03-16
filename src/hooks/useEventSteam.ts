import { useEffect } from "react"
import { useDirectoryStore } from "@/stores"
import type { Event } from "@opencode-ai/sdk/v2";
import { oc } from "@/lib/opencode"
import { handleEvent } from "@/events/eventRoute";

export function useEventStream() {

    const selectedDirectory = useDirectoryStore(s => s.selectedDirectory)

    useEffect(() => {

        if (!selectedDirectory) return

        let stream: AsyncGenerator<Event> | null = null

        const subscribe = async () => {

            const events = await oc.event.subscribe({
                directory: selectedDirectory
            })

            stream = events.stream

            for await (const event of stream) {
                handleEvent(event)
            }

        }

        subscribe()

        return () => {
            stream?.return?.("")
        }

    }, [selectedDirectory])

}