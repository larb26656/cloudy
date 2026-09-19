import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";

export default defineContentScript({
  matches: ["<all_urls>"],
  async main() {
    console.log("Hello content.");

    const content = getPageContent();

    await browser.runtime
      .sendMessage({
        type: "CONTENT_UPDATE",
        text: content.content,
      })
      .catch(() => {});

    let timeout: ReturnType<typeof setTimeout>;

    document.addEventListener("selectionchange", () => {
      clearTimeout(timeout);

      timeout = setTimeout(async () => {
        const text = window.getSelection()?.toString().trim();

        await onReceiveSelectEvent(text);
      }, 300);
    });

    browser.runtime.onMessage.addListener((message) => {
      if (message.type === "GET_PAGE_CONTENT") {
        return Promise.resolve({
          title: document.title,
          url: location.href,
          content: document.body.innerText,
        });
      }
    });
  },
});

function getPageContent() {
  const doc = document.cloneNode(true) as Document;

  const article = new Readability(doc).parse();
  const turndown = new TurndownService();

  const markdown = article?.content ? turndown.turndown(article.content) : "";

  return {
    title: document.title,
    url: location.href,
    content: markdown,
  };
}

async function onReceiveSelectEvent(text: string | undefined) {
  await browser.runtime
    .sendMessage({
      type: "TEXT_SELECTED",
      text,
    })
    .catch(() => {
      // ไม่มี UI เปิดอยู่
    });
}
