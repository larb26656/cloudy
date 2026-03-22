import { env } from "@/config/env";
import { ensureTrailingSlash } from "../url";

export function getEvent({ directory }: { directory: string }): EventSource {
    const url = new URL("event", ensureTrailingSlash(env.OPENCODE_API_URL));

    if (directory) {
        url.searchParams.set("directory", directory);
    }

    const es = new EventSource(url);

    return es;
}