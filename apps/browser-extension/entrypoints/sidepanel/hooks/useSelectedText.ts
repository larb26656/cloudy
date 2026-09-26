import { useEffect, useState } from "react";

export interface SelectionDraft {
  text: string;
  receivedAt: number;
}

export function useSelectedText() {
  const [selectionDraft, setSelectionDraft] = useState<SelectionDraft | null>(
    null,
  );

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
        setSelectionDraft(
          message.text ? { text: message.text, receivedAt: Date.now() } : null,
        );
      }
    };

    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }, []);

  const dismissSelection = () => setSelectionDraft(null);

  return { selectionDraft, dismissSelection };
}
