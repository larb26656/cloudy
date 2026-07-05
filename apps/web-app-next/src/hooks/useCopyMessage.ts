import { useState, useCallback } from "react";

export function useCopyMessage(getText: () => string) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const text = getText();
    if (text) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [getText]);

  return { copied, handleCopy };
}
