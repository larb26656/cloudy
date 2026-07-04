import { hc } from "hono/client";
import type { AppType } from "@repo/contracts";
import { env } from "@/config/env";
import { useServerSettingsStore } from "@/stores/serverSettingsStore";

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

useServerSettingsStore.subscribe(() => {
  cachedClient = null;
});

export const cloudyClient = getClient();
