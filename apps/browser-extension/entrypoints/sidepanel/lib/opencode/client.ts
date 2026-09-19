import {
  createOpencodeClient,
  type OpencodeClient,
} from "@opencode-ai/sdk/v2/client";
import { cloudyApiUrl } from "../../config/env";

export const CLOUDY_PROXY_URL = `${cloudyApiUrl}/oc`;

export function createClient(directory: string): OpencodeClient {
  return createOpencodeClient({
    baseUrl: CLOUDY_PROXY_URL,
    headers: { "X-OpenCode-Directory": directory },
  });
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "OpenCode request failed";
}
