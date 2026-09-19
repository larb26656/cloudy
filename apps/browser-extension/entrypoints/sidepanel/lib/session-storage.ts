export const SESSION_STORAGE_KEY = "latest-session-id";

export async function getStoredSessionId(): Promise<string | null> {
  const stored = await browser.storage.local.get(SESSION_STORAGE_KEY);
  const value = stored[SESSION_STORAGE_KEY];
  return typeof value === "string" ? value : null;
}

export async function storeSessionId(sessionId: string): Promise<void> {
  await browser.storage.local.set({ [SESSION_STORAGE_KEY]: sessionId });
}

export async function clearStoredSessionId(): Promise<void> {
  await browser.storage.local.remove(SESSION_STORAGE_KEY);
}
