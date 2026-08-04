import preview from "@/storybook/preview";
import type { Tab } from "@/stores/tabStore";
import { WebviewContent } from "./WebviewContent";

type WebviewTab = Extract<Tab, { type: "webview" }>;

/**
 * Build a tab literal with a fake id that does NOT exist in the tab store.
 * `WebviewContent` reads `tab.data.url` from the prop (not the store), so it
 * renders fine; if the user navigates, `updateTabData("story-webview", ...)`
 * maps over the real store tabs, finds no match, and no-ops — so this story
 * needs no store mocking and has no side effects.
 */
function makeTab(url: string): WebviewTab {
  return {
    id: "story-webview",
    type: "webview",
    data: { url },
    updatedAt: Date.now(),
  } as WebviewTab;
}

const meta = preview.meta({
  title: "Webview/WebviewContent",
  component: WebviewContent,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <div className="mx-auto h-[480px] w-[800px] border rounded overflow-hidden">
      <WebviewContent {...args} />
    </div>
  ),
});

export default meta;

export const Default = meta.story({
  args: { tab: makeTab("https://example.com") },
});
