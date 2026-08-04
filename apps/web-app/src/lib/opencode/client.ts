import {
  createOpencodeClient,
  type OpencodeClient,
} from "@opencode-ai/sdk/v2/client";
import { env } from "@/config/env";

export type SdkError = {
  message?: string;
  data?: unknown;
  errors?: Array<{ message?: string }>;
  name?: string;
};

export function getErrorMessage(error: SdkError): string {
  if (error.message) return error.message;
  if (error.errors && error.errors.length > 0 && error.errors[0].message) {
    return error.errors[0].message;
  }
  if (error.data && typeof error.data === "object" && "message" in error.data) {
    return String((error.data as { message: string }).message);
  }
  return "Unknown error";
}

export type OCClient = OpencodeClient;

export function createOcClient({ baseUrl }: { baseUrl: string }): OCClient {
  return createOpencodeClient({
    baseUrl: env.getOpencodeApiUrl(),
    headers: {
      "X-OpenCode-API-Base": baseUrl,
    },
  });
}
