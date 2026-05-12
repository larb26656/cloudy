import { createHubClient } from '../src/lib/hub-client/client';
import type { SendSelectionData } from '../src/lib/hub-client/type';

const HUB_URL = 'http://localhost:4242/context';
const hubClient = createHubClient(HUB_URL);

export default defineBackground(() => {
  browser.contextMenus.create({
    id: 'send-to-cloudy',
    title: 'Send to Cloudy',
    contexts: ['selection'],
  });

  browser.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === 'send-to-cloudy' && info.selectionText) {

      hubClient.sendSelection({
        url: info.pageUrl || '',
        selection: info.selectionText,
      });
    }
  });

  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'sendToHub') {
      const data = message.data as SendSelectionData;

      hubClient.sendSelection(data)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((result) => {
          sendResponse({ success: true, result });
        })
        .catch((err) => {
          sendResponse({ success: false, error: err.message });
        });

      return true;
    }

    return false;
  });
});