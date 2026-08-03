import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChatProvider } from "../ChatProvider";
import { ChatInput } from "./ChatInput";
import preview from "@/storybook/preview";
import type { SessionStatus } from "@opencode-ai/sdk/v2";

const SESSION_ID = "ses_story_input";
const DIRECTORY = "/demo/project";

function makeHandlers(status: SessionStatus) {
  return [
    http.get("*/oc/session/status", () =>
      HttpResponse.json({ [SESSION_ID]: status }),
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

function ChatInputStory({ initialValue }: { initialValue?: string }) {
  return (
    <ChatProvider workspace={null} directory={DIRECTORY} sessionId={SESSION_ID}>
      <ChatInput initialValue={initialValue} />
    </ChatProvider>
  );
}

const meta = preview.meta({
  title: "Chat/ChatInput/ChatInput",
  component: ChatInput,
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
  render: () => <ChatInputStory />,
  parameters: { msw: { handlers: makeHandlers({ type: "idle" }) } },
});

export const StreamingEmpty = meta.story({
  render: () => <ChatInputStory />,
  parameters: { msw: { handlers: makeHandlers({ type: "busy" }) } },
});

export const StreamingWithText = meta.story({
  render: () => (
    <ChatInputStory initialValue="Follow-up question queued while streaming" />
  ),
  parameters: { msw: { handlers: makeHandlers({ type: "busy" }) } },
});
