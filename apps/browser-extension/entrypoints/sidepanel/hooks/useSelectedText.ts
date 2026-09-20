import { useEffect, useState } from "react";

export function useSelectedText() {
  const [selectedText, setSelectedText] = useState("");

  useEffect(() => {
    const listener = (message: unknown) => {
      if (
        typeof message === "object" &&
        message !== null &&
        "type" in message &&
        message.type === "TEXT_SELECTED" &&
        "text" in message &&
        typeof message.text === "string"
      ) {
        setSelectedText(message.text);
      }
    };

    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }, []);

  return selectedText;
}
