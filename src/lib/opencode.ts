import { createOpencodeClient } from "@opencode-ai/sdk/v2";


export const oc = createOpencodeClient({
    baseUrl: "http://localhost:4096",
    throwOnError: true
});


