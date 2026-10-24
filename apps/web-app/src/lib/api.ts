import { hc } from "hono/client";
import type { AppType } from "@repo/contracts";
import { env } from "@/config/env";

export const cloudyClient = hc<AppType>(env.getApiUrl(), {
  headers: env.getAuthHeaders(),
  init: {
    credentials: "include",
  },
});
