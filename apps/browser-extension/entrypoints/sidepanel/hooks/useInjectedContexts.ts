import { useEffect, useMemo, useState } from "react";
import type { Message } from "@repo/ui/components/message/types";
import {
  areHashesEqual,
  getInjectedContextTexts,
} from "../lib/opencode/context";
import { hashText } from "../lib/utils";

export function useInjectedContexts(messages: Message[]) {
  const [contextHashes, setContextHashes] = useState<Set<string>>(new Set());
  const contextTexts = useMemo(
    () => getInjectedContextTexts(messages),
    [messages],
  );

  useEffect(() => {
    void Promise.all(contextTexts.map(hashText)).then((hashes) => {
      const next = new Set(hashes);
      setContextHashes((current) =>
        areHashesEqual(current, next) ? current : next,
      );
    });
  }, [contextTexts]);

  const isInContext = async (context: string) => {
    return contextHashes.has(await hashText(context));
  };

  return { isInContext };
}
