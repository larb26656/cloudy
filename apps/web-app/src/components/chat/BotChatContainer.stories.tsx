import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BotChatContainer } from "./BotChatContainer";
import preview from "@/storybook/preview";
import type { Message } from "@/types";
import type {
  AssistantMessage,
  Part,
  SessionStatus,
  UserMessage,
} from "@opencode-ai/sdk/v2";

const SESSION_ID = "ses_story_bot_container";
const DIRECTORY = "/demo/project";
const NOW = Date.now();

const idleStatus: Record<string, SessionStatus> = {
  [SESSION_ID]: { type: "idle" },
};

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
      },
    },
  ],
};

function makeUserMessage(): Message {
  const info: UserMessage = {
    id: "msg-user-1",
    sessionID: SESSION_ID,
    role: "user",
    time: { created: NOW },
    agent: "build",
    model: { providerID: "anthropic", modelID: "claude-sonnet-4-20250514" },
  };
  const textPart = {
    id: "part-user-1",
    sessionID: SESSION_ID,
    messageID: "msg-user-1",
    type: "text" as const,
    text: "What can you do?",
  };
  return { info, parts: [textPart as Part] };
}

function makeAssistantMessage(): Message {
  const info: AssistantMessage = {
    id: "msg-assistant-1",
    sessionID: SESSION_ID,
    role: "assistant",
    time: { created: NOW + 1000 },
    parentID: "msg-user-1",
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
  const textPart = {
    id: "part-assistant-1",
    sessionID: SESSION_ID,
    messageID: "msg-assistant-1",
    type: "text" as const,
    text: "I'm a lightweight bot chat. Ask me anything and I'll answer right here in this panel.",
  };
  return { info, parts: [textPart as Part] };
}

function createHandlers() {
  return [
    http.get("*/oc/session/status", () => HttpResponse.json(idleStatus)),
    http.get(`*/oc/session/${SESSION_ID}/message`, ({ request }) => {
      const before = new URL(request.url).searchParams.get("before");
      if (before) return HttpResponse.json([]);
      return HttpResponse.json([makeUserMessage(), makeAssistantMessage()]);
    }),
    http.get("*/oc/config/providers", () =>
      HttpResponse.json(SAMPLE_PROVIDERS),
    ),
    http.post("*/oc/session/*/prompt_async", () =>
      HttpResponse.json({ id: "msg_story_sent" }),
    ),
    http.post("*/oc/session/*/abort", () => HttpResponse.json(null)),
    http.get("*/oc/session/*/children", () => HttpResponse.json([])),
    http.get("*/oc/question", () => HttpResponse.json([])),
    http.get("*/oc/permission", () => HttpResponse.json([])),
  ];
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
    mutations: { retry: false },
  },
});

const meta = preview.meta({
  title: "Chat/BotChatContainer",
  component: BotChatContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    msw: { handlers: createHandlers() },
  },
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

export const Default = meta.story({
  render: () => (
    <div className="h-[600px] max-w-3xl mx-auto w-full border rounded-xl overflow-hidden">
      <BotChatContainer directory={DIRECTORY} sessionId={SESSION_ID} />
    </div>
  ),
});
