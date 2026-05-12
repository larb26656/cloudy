import TurndownService, { type Node } from 'turndown';

export default defineContentScript({
  matches: ['<all_urls>'],
  async main() {
    const turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });

    turndown.addRule('strikethrough', {
      filter: (node: Node) =>
        node.nodeName === 'DEL' || node.nodeName === 'S' || node.nodeName === 'STRIKE',
      replacement: (content: string) => `~~${content}~~`,
    });

    turndown.addRule('checkbox', {
      filter: (node: Node) =>
        node.nodeName === 'INPUT' && (node as HTMLInputElement).type === 'checkbox',
      replacement: (content: string) => (content.trim() ? '[x]' : '[ ]'),
    });

    const storeKey = 'selectedContext';

    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.action === 'getSelection') {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') {
          sendResponse({ success: false, error: 'No selection' });
          return true;
        }

        const range = selection.getRangeAt(0);
        const container = document.createElement('div');
        container.appendChild(range.cloneContents());

        const html = container.innerHTML;
        const markdown = turndown.turndown(html);
        const text = selection.toString();

        const data = {
          url: window.location.href,
          title: document.title,
          text,
          markdown,
          timestamp: new Date().toISOString(),
        };

        browser.storage.local.set({ [storeKey]: data }).then(() => {
          sendResponse({ success: true, data });
        });
        return true;
      }

      if (message.action === 'clearSelection') {
        browser.storage.local.remove(storeKey).then(() => {
          sendResponse({ success: true });
        });
        return true;
      }

      return false;
    });
  },
});