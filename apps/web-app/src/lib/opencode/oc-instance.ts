import { createOcClient, type OCClient } from "./client";

const OC_INSTANCE_BASE_URL =
  import.meta.env.VITE_OC_INSTANCE_URL ?? "http://127.0.0.1:4096";

let cached: OCClient | null = null;

export function getOcClient(): OCClient {
  if (!cached) {
    cached = createOcClient({ baseUrl: OC_INSTANCE_BASE_URL });
  }
  return cached;
}

/**
 * Direct URL of the opencode instance (e.g. `http://127.0.0.1:4096`).
 * Use this for transports that the cloudy HTTP proxy cannot carry, such as
 * the PTY WebSocket. Contrast with `env.getOpencodeApiUrl()` which is the
 * cloudy proxy path (`/api/oc`).
 */
export function getOcInstanceUrl(): string {
  return OC_INSTANCE_BASE_URL;
}
