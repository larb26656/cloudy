import { createOpencodeClient, type OpencodeClient } from "@opencode-ai/sdk/v2/client";
import { ensureTrailingSlash } from "../url";

export type SdkError = {
    message?: string;
    data?: unknown;
    errors?: Array<{ message?: string }>;
    name?: string;
};

export function getErrorMessage(error: SdkError): string {
    if (error.message) return error.message;
    if (error.errors && error.errors.length > 0 && error.errors[0].message) {
        return error.errors[0].message;
    }
    if (error.data && typeof error.data === 'object' && 'message' in error.data) {
        return String((error.data as { message: string }).message);
    }
    return 'Unknown error';
}

export type OCClient = OpencodeClient & {
    getEvent: ({ directory }: { directory: string }) => EventSource
}

export function createOcClient({ baseUrl }: { baseUrl: string }): OCClient {
    const oc = createOpencodeClient({
        baseUrl: baseUrl
    }) as OCClient;

    oc.getEvent = ({ directory }: { directory: string }) => {

        const url = new URL("event", ensureTrailingSlash(baseUrl));

        if (directory) {

            url.searchParams.set("directory", directory);

        }

        return new EventSource(url);

    };

    return oc as OCClient;
}


