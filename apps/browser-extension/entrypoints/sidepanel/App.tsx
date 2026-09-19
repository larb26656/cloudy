import { useState } from "react";
import "./App.css";

function App() {
  const [content, setContent] = useState("");
  const [selectedText, setSelectedText] = useState("");

  useEffect(() => {
    const listener = (message: any) => {
      if (message.type === "TEXT_SELECTED") {
        setSelectedText(message.text);
      }

      if (message.type === "CONTENT_UPDATE") {
        setContent(message.text);
      }
    };

    browser.runtime.onMessage.addListener(listener);

    return () => {
      browser.runtime.onMessage.removeListener(listener);
    };
  }, []);

  const handleReadPage = async () => {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab?.id) return;

    const result = await browser.tabs.sendMessage(tab.id, {
      type: "GET_PAGE_CONTENT",
    });

    setContent(result.content);
  };

  return (
    <>
      <h1>Page Reader</h1>

      <button onClick={handleReadPage}>Read Current Page</button>

      <h2>Content</h2>
      <pre>{content}</pre>

      <h2>Select text</h2>
      <pre>{selectedText}</pre>
    </>
  );
}

export default App;
