import { hc } from "hono/client";
import type { InferResponseType } from "hono/client";
import type { AppType } from "@repo/contracts";
import { cloudyApiUrl } from "../../config/env";

export const CLOUDY_API_URL = cloudyApiUrl;

const cloudyClient = hc<AppType>(CLOUDY_API_URL, {
  init: { credentials: "include" },
});

type BrowserWorkspaceResponse = InferResponseType<
  (typeof cloudyClient.api)["browser-workspace"]["$get"]
>;

async function unwrap(response: Response): Promise<BrowserWorkspaceResponse> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Cloudy request failed (${response.status})`);
  }
  return response.json() as Promise<BrowserWorkspaceResponse>;
}

export function getBrowserWorkspaceStatus(): Promise<BrowserWorkspaceResponse> {
  return cloudyClient.api["browser-workspace"].$get().then(unwrap);
}

export function initializeBrowserWorkspace(): Promise<BrowserWorkspaceResponse> {
  return cloudyClient.api["browser-workspace"].initialize.$post().then(unwrap);
}
