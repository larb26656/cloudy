import { treaty } from "@elysiajs/eden";
import type { App } from "@cloudy/contracts";
import { env } from "@/config/env";

export const apiClient = treaty<App>(env.API_URL, {
    parseDate: false,
});