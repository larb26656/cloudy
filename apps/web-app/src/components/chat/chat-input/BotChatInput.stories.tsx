import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatProvider } from "../ChatProvider";
import { MessageScrollerProvider } from "@/components/ui/message-scroller";
import { BotChatInput } from "./BotChatInput";
import preview from "@/storybook/preview";
import type { SessionStatus } from "@opencode-ai/sdk/v2";

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
    http.get("*/oc/session/status", () =>
      HttpResponse.json({ [SESSION_ID]: status }),
    ),
    http.get("*/oc/config/providers", () =>
      HttpResponse.json(SAMPLE_PROVIDERS),
    ),
    http.post("*/oc/session/*/prompt_async", () =>
      HttpResponse.json({ id: "msg_story_sent" }),
    ),
    http.post("*/oc/session/*/abort", () => HttpResponse.json(null)),
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
