import { beforeEach, describe, expect, it } from "vitest";
import { useChatPanelStore } from "./chatPanelStore";

describe("chatPanelStore", () => {
  beforeEach(() => {
    useChatPanelStore.setState({ filesOpenByTabId: {}, filesWidthByTabId: {} });
  });

  it("clearTab removes the tab entry from both maps", () => {
    const { setFilesOpen, setFilesWidth, clearTab } =
      useChatPanelStore.getState();
    setFilesOpen("tab-1", true);
    setFilesWidth("tab-1", 45);
    setFilesWidth("tab-2", 60);

    clearTab("tab-1");

    const state = useChatPanelStore.getState();
    expect(state.filesOpenByTabId).toEqual({});
    expect(state.filesWidthByTabId).toEqual({ "tab-2": 60 });
  });

  it("pruneExcept keeps only entries for live tabs", () => {
    const { setFilesOpen, setFilesWidth, pruneExcept } =
      useChatPanelStore.getState();
    setFilesOpen("tab-1", true);
    setFilesOpen("tab-orphan", true);
    setFilesWidth("tab-1", 45);
    setFilesWidth("tab-orphan", 60);
    setFilesWidth("tab-2", 30);

    pruneExcept(new Set(["tab-1", "tab-2"]));

    const state = useChatPanelStore.getState();
    expect(state.filesOpenByTabId).toEqual({ "tab-1": true });
    expect(state.filesWidthByTabId).toEqual({ "tab-1": 45, "tab-2": 30 });
  });

  it("pruneExcept with no live tabs empties both maps", () => {
    const { setFilesOpen, setFilesWidth, pruneExcept } =
      useChatPanelStore.getState();
    setFilesOpen("tab-1", true);
    setFilesWidth("tab-1", 45);

    pruneExcept(new Set());

    const state = useChatPanelStore.getState();
    expect(state.filesOpenByTabId).toEqual({});
    expect(state.filesWidthByTabId).toEqual({});
  });
});
