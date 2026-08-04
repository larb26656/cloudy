import preview from "@/storybook/preview";
import type { Tab } from "@/stores/tabStore";
import { WebviewTabItem } from "./WebviewTabItem";

type WebviewTab = Extract<Tab, { type: "webview" }>;

function makeTab(url: string): WebviewTab {
  return {
    id: "story-webview",
    type: "webview",
    data: { url },
    updatedAt: Date.now(),
  } as WebviewTab;
}

const noop = () => {};

const meta = preview.meta({
  title: "Webview/WebviewTabItem",
  component: WebviewTabItem,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
});

export default meta;

export const HttpsUrl = meta.story({
  args: {
    tab: makeTab("https://github.com"),
    isActive: false,
    onClick: noop,
    onClose: noop,
  },
});

export const Localhost = meta.story({
  args: {
    tab: makeTab("http://localhost:3001"),
    isActive: false,
    onClick: noop,
    onClose: noop,
  },
});

export const IpAddress = meta.story({
  args: {
    tab: makeTab("http://127.0.0.1:4122"),
    isActive: false,
    onClick: noop,
    onClose: noop,
  },
});

export const InvalidUrl = meta.story({
  args: {
    tab: makeTab("not a real url"),
    isActive: false,
    onClick: noop,
    onClose: noop,
  },
});

export const Active = meta.story({
  args: {
    tab: makeTab("https://example.com"),
    isActive: true,
    onClick: noop,
    onClose: noop,
  },
});
