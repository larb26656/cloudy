import { hc } from "hono/client";
import type { AppType } from "@cloudy/contracts";
import { env } from "@/config/env";

const client = hc<AppType>(env.API_URL, {
    init: {
        credentials: "include",
    },
});

export const api = client.api;
export const apiClient = client;
