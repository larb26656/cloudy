import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { ChatMinimap } from "./ChatMinimap";
import { cn } from "@/lib/utils";
import preview from "../../../.storybook/preview";
import type { Message } from "@/types";
import type { AssistantMessage, Part, UserMessage } from "@opencode-ai/sdk/v2";

const SESSION_ID = "ses_minimap_story";
const DIRECTORY = "/demo/project";
const NOW = Date.now();

function makeUserMessage(id: string, text: string): Message {
  const info: UserMessage = {
    id,
    sessionID: SESSION_ID,
    role: "user",
    time: { created: NOW },
    agent: "build",
    model: { providerID: "anthropic", modelID: "claude-sonnet-4-20250514" },
  };
  const textPart = {
    id: `part-${id}`,
    sessionID: SESSION_ID,
    messageID: id,
    type: "text" as const,
    text,
  };
  return { info, parts: [textPart as Part] };
}

function makeAssistantMessage(
  id: string,
  parts: Part[],
  parentId: string,
): Message {
  const info: AssistantMessage = {
    id,
    sessionID: SESSION_ID,
    role: "assistant",
    time: { created: NOW + 1 },
    parentID: parentId,
    modelID: "claude-sonnet-4-20250514",
    providerID: "anthropic",
    mode: "agent",
    agent: "build",
    path: { cwd: DIRECTORY, root: DIRECTORY },
    cost: 0,
    tokens: {
      input: 0,
      output: 0,
      reasoning: 0,
      cache: { read: 0, write: 0 },
    },
  } as AssistantMessage;
  return { info, parts };
}

function textPart(messageId: string, text: string): Part {
  return {
    id: `part-${messageId}-text`,
    sessionID: SESSION_ID,
    messageID: messageId,
    type: "text",
    text,
  } as Part;
}

function reasoningPart(messageId: string, text: string): Part {
  return {
    id: `part-${messageId}-reasoning`,
    sessionID: SESSION_ID,
    messageID: messageId,
    type: "reasoning",
    text,
    time: { start: NOW, end: NOW + 1000 },
  } as Part;
}

function toolPart(
  messageId: string,
  tool: string,
  input: Record<string, unknown>,
): Part {
  return {
    id: `part-${messageId}-tool`,
    sessionID: SESSION_ID,
    messageID: messageId,
    type: "tool",
    tool,
    state: {
      status: "completed",
      input,
      output: "ok",
      time: { start: NOW, end: NOW + 500 },
    },
  } as unknown as Part;
}

const MOCK_MESSAGES: Message[] = [
  makeUserMessage(
    "msg-1",
    "How do I set up a pnpm monorepo with Turborepo? Can you walk me through the folder structure?",
  ),
  makeAssistantMessage(
    "msg-2",
    [
      reasoningPart(
        "msg-2",
        "User wants monorepo setup. I'll outline the canonical cloudy layout.",
      ),
      textPart(
        "msg-2",
        "## Monorepo Setup\n\nUse `pnpm` workspaces + Turborepo. The canonical structure:\n\n```\napps/\n  server/\n  web-app/\npackages/\n  contracts/\n  server/\n```\n\nDefine `workspace:*` for internal deps.",
      ),
    ],
    "msg-1",
  ),
  makeUserMessage(
    "msg-3",
    "What's the difference between the chat tab and the chat-node desk node? They share UI?",
  ),
  makeAssistantMessage(
    "msg-4",
    [
      textPart(
        "msg-4",
        "Yes — both consume the **same** chat UI under `src/components/chat/`. The chat tab is the full-page surface; the chat-node is the React Flow node on the Desk canvas. The split lives in `apps/web-app/AGENTS.md` under 'Component organization'.",
      ),
    ],
    "msg-3",
  ),
  makeUserMessage("msg-5", "Show me the tool-call flow."),
  makeAssistantMessage(
    "msg-6",
    [
      toolPart("msg-6", "read_file", { path: "AGENTS.md" }),
      textPart(
        "msg-6",
        "I read `AGENTS.md`. The tool-call flow: the assistant emits a `tool` part, the permission banner surfaces, on approval the tool runs, output streams back as a part. `MessageBubble` renders each part via `MessageParts`.",
      ),
    ],
    "msg-5",
  ),
  makeUserMessage(
    "msg-7",
    "Help me debug a CORS error between web-app (3001) and the server (4122).",
  ),
  makeAssistantMessage(
    "msg-8",
    [
      reasoningPart(
        "msg-8",
        "CORS in dev: web-app origin 3001, server 4122. Server must allow the origin.",
      ),
      textPart(
        "msg-8",
        "Run `cloudy serve --cors` to allow the web-app origin. There's **no Vite proxy** — requests go directly to the API origin. See `apps/web-app/AGENTS.md` → 'API base URLs (dev)'.",
      ),
    ],
    "msg-7",
  ),
  makeUserMessage("msg-9", "Add a Storybook story for a new chat component."),
  makeAssistantMessage(
    "msg-10",
    [
      textPart(
        "msg-10",
        "Use `preview.meta({ title, component, tags: ['autodocs'] })` + `meta.story({ args })`. Co-locate the story next to the component. For controlled components, wrap in a `Demo` that owns state. See `ColorPicker.stories.tsx` for the pattern.",
      ),
    ],
    "msg-9",
  ),
];

function MessageRow({ message }: { message: Message }) {
  const isUser = message.info.role === "user";
  return (
    <div
      className={cn(
        "mx-auto max-w-3xl px-6 py-4 border-b last:border-b-0",
        isUser ? "bg-muted/30" : "bg-background",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "size-6 shrink-0 rounded-full flex items-center justify-center text-xs font-medium",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {isUser ? "U" : "A"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            {isUser ? "User" : "Assistant"} ·{" "}
            <code className="text-xs">{message.info.id}</code>
          </div>
          {message.parts
            .filter((p) => p.type === "text")
            .map((p, i) => {
              const text = (p as unknown as { text: string }).text;
              return (
                <div key={i} className="text-sm whitespace-pre-wrap">
                  {text.length > 280 ? text.slice(0, 280) + "…" : text}
                </div>
              );
            })}
          {message.parts.some((p) => p.type === "reasoning") && (
            <div className="mt-1 text-xs text-muted-foreground italic">
              [reasoning part hidden]
            </div>
          )}
          {message.parts.some((p) => p.type === "tool") && (
            <div className="mt-1 text-xs text-muted-foreground italic">
              [tool call part hidden]
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatMinimapDemo() {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <span className="text-sm font-medium">Chat Surface</span>
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-xs px-2 py-1 rounded border hover:bg-muted"
          >
            {open ? "Hide" : "Show"} minimap
          </button>
        </div>

        <div className="relative flex-1 min-h-0">
          <MessageScrollerProvider>
            <MessageScroller className="h-full">
              <MessageScrollerViewport>
                <MessageScrollerContent className="gap-0">
                  {MOCK_MESSAGES.map((m) => (
                    <MessageScrollerItem
                      key={m.info.id}
                      messageId={m.info.id}
                      scrollAnchor={m.info.role === "user"}
                    >
                      <MessageRow message={m} />
                    </MessageScrollerItem>
                  ))}
                </MessageScrollerContent>
              </MessageScrollerViewport>
            </MessageScroller>

            {open && (
              <ChatMinimap
                messages={MOCK_MESSAGES}
                onClose={() => setOpen(false)}
              />
            )}
          </MessageScrollerProvider>
        </div>
      </div>
    </div>
  );
}

const meta = preview.meta({
  title: "Chat/ChatMinimap",
  component: ChatMinimap,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story:
          "Chat outline panel. Renders inside `MessageScrollerProvider` and uses `useMessageScroller().scrollToMessage` + `useMessageScrollerVisibility()` from the message-scroller primitive. Click an item to smooth-scroll the matching message into view; the active row tracks the currently-visible user anchor. The search box filters items by preview substring.",
      },
    },
  },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
});

export default meta;

export const Default = meta.story({
  render: () => <ChatMinimapDemo />,
});
