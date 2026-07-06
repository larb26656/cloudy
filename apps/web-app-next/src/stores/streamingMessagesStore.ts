import { create } from "zustand";
import { queryClient } from "@/lib/opencode/query-client";
import { messageKeys } from "@/lib/opencode/query-keys";
import type { Message } from "@/types";
import type { TextPart } from "@opencode-ai/sdk/v2";

interface TextBuffer {
  textId: string;
  text: string;
  started: boolean;
}

interface StreamingMessageState {
  message: Message;
  textBuffers: Map<string, TextBuffer>;
  status: "started" | "streaming" | "finished";
}

interface StreamingMessagesStore {
  streamingMessages: Map<string, StreamingMessageState>;

  onMessageCreated: (sessionId: string, message: Message) => void;
  onTextStarted: (sessionId: string, messageId: string, textId: string) => void;
  onTextDelta: (sessionId: string, textId: string, delta: string) => void;
  onTextEnded: (sessionId: string, textId: string, finalText: string) => void;
  onMessageUpdated: (sessionId: string, message: Message) => void;

  getStreamingMessage: (sessionId: string) => StreamingMessageState | undefined;
  getActiveSessions: () => string[];
  clearStreamingMessage: (sessionId: string) => void;
}

export const useStreamingMessagesStore = create<StreamingMessagesStore>(
  (set, get) => ({
    streamingMessages: new Map(),

    onMessageCreated: (sessionId, message) => {
      set((state) => {
        console.log("onMessageCreated");
        const newMap = new Map(state.streamingMessages);
        newMap.set(sessionId, {
          message,
          textBuffers: new Map(),
          status: "started",
        });
        return { streamingMessages: newMap };
      });
    },

    onTextStarted: (sessionId, _messageId, textId) => {
      set((state) => {
        console.log("onTextStarted");
        const existing = state.streamingMessages.get(sessionId);
        if (!existing) return state;

        const newBuffers = new Map(existing.textBuffers);
        newBuffers.set(textId, { textId, text: "", started: true });

        const newMap = new Map(state.streamingMessages);
        newMap.set(sessionId, {
          ...existing,
          textBuffers: newBuffers,
          status: "streaming",
        });
        return { streamingMessages: newMap };
      });
    },

    onTextDelta: (sessionId, textId, delta) => {
      set((state) => {
        console.log("onTextDelta");
        const existing = state.streamingMessages.get(sessionId);
        if (!existing) return state;

        const buffer = existing.textBuffers.get(textId);
        if (!buffer) return state;

        const newBuffers = new Map(existing.textBuffers);
        newBuffers.set(textId, {
          ...buffer,
          text: buffer.text + delta,
        });

        const updatedMessage = buildMessageWithBuffers(
          existing.message,
          newBuffers,
        );

        const newMap = new Map(state.streamingMessages);
        newMap.set(sessionId, {
          ...existing,
          message: updatedMessage,
          textBuffers: newBuffers,
          status: "streaming",
        });
        return { streamingMessages: newMap };
      });
    },

    onTextEnded: (sessionId, textId, finalText) => {
      const existing = get().streamingMessages.get(sessionId);
      if (!existing) return;

      const newBuffers = new Map(existing.textBuffers);
      newBuffers.set(textId, { textId, text: finalText, started: false });

      const completedMessage = buildMessageWithBuffers(
        existing.message,
        newBuffers,
      );

      set((state) => {
        console.log("textEnd");
        const newMap = new Map(state.streamingMessages);
        newMap.set(sessionId, {
          ...existing,
          message: completedMessage,
          textBuffers: newBuffers,
          status: "finished",
        });
        return { streamingMessages: newMap };
      });

      pushToQueryCache(sessionId, completedMessage);

      set((state) => {
        const newMap = new Map(state.streamingMessages);
        newMap.delete(sessionId);
        return { streamingMessages: newMap };
      });
    },

    onMessageUpdated: (sessionId, message) => {
      const existing = get().streamingMessages.get(sessionId);
      if (!existing) return;

      const updatedMessage: Message = {
        ...existing.message,
        info: message.info,
        parts: message.parts,
      };

      set((state) => {
        const newMap = new Map(state.streamingMessages);
        newMap.set(sessionId, {
          ...existing,
          message: updatedMessage,
        });
        return { streamingMessages: newMap };
      });
    },

    getStreamingMessage: (sessionId) => {
      return get().streamingMessages.get(sessionId);
    },

    getActiveSessions: () => {
      return Array.from(get().streamingMessages.keys());
    },

    clearStreamingMessage: (sessionId) => {
      set((state) => {
        const newMap = new Map(state.streamingMessages);
        newMap.delete(sessionId);
        return { streamingMessages: newMap };
      });
    },
  }),
);

function buildMessageWithBuffers(
  message: Message,
  textBuffers: Map<string, TextBuffer>,
): Message {
  const textParts: TextPart[] = [];

  for (const [textId, buffer] of textBuffers) {
    const existingTextPart = message.parts.find(
      (p): p is TextPart => p.type === "text" && p.id === textId,
    );

    textParts.push({
      id: textId,
      sessionID: message.info.sessionID,
      messageID: message.info.id,
      type: "text",
      text: buffer.text || existingTextPart?.text || "",
      synthetic: existingTextPart?.synthetic,
      ignored: existingTextPart?.ignored,
      time: existingTextPart?.time,
    });
  }

  const otherParts = message.parts.filter((p) => p.type !== "text");

  return {
    ...message,
    parts: [...otherParts, ...textParts],
  };
}

function pushToQueryCache(sessionId: string, message: Message) {
  queryClient.setQueryData(
    messageKeys.infinite(sessionId),
    (
      old:
        | { pages: Message[][]; pageParams: (string | undefined)[] }
        | undefined,
    ) => {
      if (!old) {
        return {
          pages: [[message]],
          pageParams: [undefined],
        };
      }

      const firstPage = old.pages[0] || [];
      const messageExists = firstPage.some(
        (m) => m.info.id === message.info.id,
      );

      if (messageExists) {
        return {
          ...old,
          pages: old.pages.map((page, idx) =>
            idx === 0
              ? page.map((m) => (m.info.id === message.info.id ? message : m))
              : page,
          ),
        };
      }

      return {
        ...old,
        pages: [[message, ...firstPage], ...old.pages],
      };
    },
  );
}
