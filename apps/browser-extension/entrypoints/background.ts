interface BrowserWithSidebar {
  sidebarAction?: {
    toggle(): Promise<void>;
  };
}

export default defineBackground(() => {
  // handle side panel
  if (browser.sidePanel) {
    browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } else {
    const { sidebarAction } = browser as typeof browser & BrowserWithSidebar;
    if (sidebarAction) {
      browser.browserAction.onClicked.addListener(() => {
        sidebarAction.toggle();
      });
    }
  }

  console.log("Hello background!", { id: browser.runtime.id });
});
