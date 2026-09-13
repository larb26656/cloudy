import { createContext, useContext } from "react";

export interface SessionViewDialogSeam {
  openSessionView: (sessionId: string, directory?: string) => void;
}

export const SessionViewDialogContext = createContext<SessionViewDialogSeam>({
  openSessionView: () => {},
});

export function useSessionViewDialog(): SessionViewDialogSeam {
  return useContext(SessionViewDialogContext);
}

export interface MessageSettings {
  autoExpandThinking: boolean;
}

export const MessageSettingsContext = createContext<MessageSettings>({
  autoExpandThinking: false,
});

export function useMessageSettings(): MessageSettings {
  return useContext(MessageSettingsContext);
}
