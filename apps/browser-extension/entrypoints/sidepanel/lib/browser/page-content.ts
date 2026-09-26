import type { PageContent } from "../opencode/context";

export async function getCurrentPageContent(): Promise<
  PageContent | undefined
> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  try {
    return await browser.tabs.sendMessage(tab.id, { type: "GET_PAGE_CONTENT" });
  } catch {
    throw new Error("Cannot get page content");
  }
}
