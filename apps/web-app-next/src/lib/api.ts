import { hc } from "hono/client";
import type { AppType } from "@repo/contracts";
import { env } from "@/config/env";

let cachedClient: ReturnType<typeof hc<AppType>> | null = null;

function getClient(): ReturnType<typeof hc<AppType>> {
  if (cachedClient) return cachedClient;
  cachedClient = hc<AppType>(env.getApiUrl(), {
    init: {
      credentials: "include",
    },
  });
  return cachedClient;
}

export const cloudyClient = getClient();
