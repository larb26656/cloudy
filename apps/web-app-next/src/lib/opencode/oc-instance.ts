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

export const OC_DIRECTORY =
  import.meta.env.VITE_OC_DIRECTORY ?? "/Users/luckytime1996/Documents/Work/One-man-show/Code/cloudy";
