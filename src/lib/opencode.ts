import { createOpencodeClient } from "@opencode-ai/sdk/v2";


export const oc = createOpencodeClient({
    baseUrl: "/api",
    throwOnError: true
});


