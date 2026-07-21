import { useTabStore } from "@/stores/tabStore";
import type { WebviewData } from "@/stores/tabStore";

function updateWebviewData(tabId: string, updater: (data: WebviewData) => WebviewData) {
  const store = useTabStore.getState();
  const tabs = store.tabs.map((t) => {
    if (t.id !== tabId || t.type !== "webview") return t;
    return { ...t, data: updater(t.data) };
  });
  useTabStore.setState({ tabs });
}

export const webviewActions = {
  navigate(tabId: string, url: string) {
    updateWebviewData(tabId, (data) => {
      const newHistory = data.history.slice(0, data.historyIndex + 1);
      newHistory.push(url);
      return {
        ...data,
        url,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  goBack(tabId: string) {
    updateWebviewData(tabId, (data) => {
      if (data.historyIndex <= 0) return data;
      const newIndex = data.historyIndex - 1;
      return {
        ...data,
        url: data.history[newIndex] ?? data.url,
        historyIndex: newIndex,
      };
    });
  },

  goForward(tabId: string) {
    updateWebviewData(tabId, (data) => {
      if (data.historyIndex >= data.history.length - 1) return data;
      const newIndex = data.historyIndex + 1;
      return {
        ...data,
        url: data.history[newIndex] ?? data.url,
        historyIndex: newIndex,
      };
    });
  },
};
