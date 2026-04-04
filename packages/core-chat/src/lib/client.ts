import type { OpencodeClient } from "@opencode-ai/sdk/v2/client";

let _oc: OpencodeClient | null = null;

export function initCoreChat(oc: OpencodeClient) {
  _oc = oc;
}

export function getOc(): OpencodeClient {
  if (!_oc) {
    throw new Error("CoreChat not initialized. Call initCoreChat(oc) first.");
  }
  return _oc;
}

export type SdkError = {
  message?: string;
  data?: unknown;
  errors?: Array<{ message?: string }>;
  name?: string;
};

export function getErrorMessage(error: SdkError): string {
  if (error.message) return error.message;
  if (error.errors && error.errors.length > 0) {
    const firstError = error.errors[0];
    if (firstError?.message) {
      return firstError.message;
    }
  }
  if (error.data && typeof error.data === 'object' && 'message' in error.data) {
    return String((error.data as { message: string }).message);
  }
  return 'Unknown error';
}

export function createDefaultTitle(isChild = false) {
  const prefix = isChild ? "Child session - " : "New session - ";
  return prefix + new Date().toISOString();
}
