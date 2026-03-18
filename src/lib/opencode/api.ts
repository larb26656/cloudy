export function getEvent({ directory }: { directory: string }): EventSource {
    const url = new URL("/api/event", window.location.origin);

    if (directory) {
        url.searchParams.set("directory", directory);
    }

    const es = new EventSource(url);

    return es;
}