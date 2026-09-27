import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@repo/ui/components/tooltip";
import { ChatProvider } from "../ChatProvider";
import { MessageScrollerProvider } from "@repo/ui/components/message-scroller";
import { BotChatInput } from "./BotChatInput";
import preview from "@/storybook/preview";
import type { SessionRunStatus as SessionStatus } from "@/types";

const SESSION_ID = "ses_story_bot_input";
const DIRECTORY = "/demo/project";

const SAMPLE_PROVIDERS = {
  providers: [
    {
      id: "anthropic",
      name: "Anthropic",
      models: {
        "claude-sonnet-4-20250514": {
          id: "claude-sonnet-4-20250514",
          name: "Claude Sonnet 4",
          status: "active",
          family: "claude",
          limit: { context: 200000 },
          capabilities: { toolcall: true },
        },
        "claude-opus-4-20250514": {
          id: "claude-opus-4-20250514",
          name: "Claude Opus 4",
          status: "active",
          family: "claude",
          limit: { context: 200000 },
          capabilities: { toolcall: true },
        },
      },
    },
  ],
};

function makeHandlers(status: SessionStatus) {
  return [
    http.get("*/api/providers/opencode/sessions/status", () =>
      HttpResponse.json({ [SESSION_ID]: status }),
    ),
    http.get("*/api/providers", () => HttpResponse.json(SAMPLE_PROVIDERS)),
    http.post("*/api/providers/opencode/messages", () =>
      HttpResponse.json({ id: "msg_story_sent" }),
    ),
    http.post("*/api/providers/opencode/sessions/*/abort", () =>
      HttpResponse.json(null),
    ),
  ];
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
    mutations: { retry: false },
  },
});

function BotChatInputStory() {
  return (
    <ChatProvider workspace={null} directory={DIRECTORY} sessionId={SESSION_ID}>
      <MessageScrollerProvider autoScroll>
        <BotChatInput />
      </MessageScrollerProvider>
    </ChatProvider>
  );
}

const meta = preview.meta({
  title: "Chat/ChatInput/BotChatInput",
  component: BotChatInput,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Story />
        </TooltipProvider>
      </QueryClientProvider>
    ),
  ],
});

export default meta;

export const Idle = meta.story({
  render: () => <BotChatInputStory />,
  parameters: { msw: { handlers: makeHandlers({ type: "idle" }) } },
});

export const Streaming = meta.story({
  render: () => <BotChatInputStory />,
  parameters: { msw: { handlers: makeHandlers({ type: "busy" }) } },
});
