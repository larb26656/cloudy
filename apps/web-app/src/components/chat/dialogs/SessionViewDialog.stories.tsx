import { useState } from "react";
import { http, HttpResponse, delay } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { SessionViewDialog } from "./SessionViewDialog";
import preview from "../../../../.storybook/preview";
import type { Message } from "@/types/message";
import type { AssistantMessage, UserMessage, Part } from "@opencode-ai/sdk/v2";

const DEMO_DIRECTORY = "/demo/project";
const DEMO_SESSION_ID = "ses_demo_123";

type MockMessage = Message;

const createUserMessage = (
  id: string,
  text: string,
  createdAt: number,
): MockMessage => ({
  info: {
    id,
    sessionID: DEMO_SESSION_ID,
    role: "user",
    time: { created: createdAt },
  } as unknown as UserMessage,
  parts: [
    {
      id: `part_${id}`,
      sessionID: DEMO_SESSION_ID,
      messageID: id,
      type: "text",
      text,
    } as unknown as Part,
  ],
});

const createAssistantMessage = (
  id: string,
  text: string,
  createdAt: number,
  modelID = "gpt-4o",
): MockMessage => ({
  info: {
    id,
    sessionID: DEMO_SESSION_ID,
    role: "assistant",
    time: { created: createdAt },
    parentID: null,
    modelID,
    providerID: "openai",
    mode: "agent",
    agent: null,
    path: { cwd: DEMO_DIRECTORY, root: DEMO_DIRECTORY },
    cost: 0,
    tokens: {
      input: 100,
      output: 200,
      reasoning: 50,
      cache: { read: 0, write: 0 },
    },
  } as unknown as AssistantMessage,
  parts: [
    {
      id: `part_${id}`,
      sessionID: DEMO_SESSION_ID,
      messageID: id,
      type: "text",
      text,
    } as unknown as Part,
  ],
});

const emptyMessages: MockMessage[] = [];

const singleMessage: MockMessage[] = [
  createUserMessage("msg_1", "Hello, can you help me with my TypeScript project?", Date.now() - 60000),
  createAssistantMessage(
    "msg_2",
    "Of course! I'd be happy to help with your TypeScript project. What specific aspect would you like assistance with?",
    Date.now() - 55000,
  ),
];

const multipleMessages: MockMessage[] = [
  createUserMessage("msg_1", "Hi, I need help building a React component", Date.now() - 300000),
  createAssistantMessage(
    "msg_2",
    "I'd be happy to help you build a React component! Could you tell me more about what the component should do?",
    Date.now() - 290000,
  ),
  createUserMessage(
    "msg_3",
    "It's a form component with validation. I need text input, email validation, and a submit button.",
    Date.now() - 280000,
  ),
  createAssistantMessage(
    "msg_4",
    "Great! A form component with validation is a common need. Let me help you create a robust solution using React hooks and validation logic.",
    Date.now() - 270000,
  ),
  createAssistantMessage(
    "msg_5",
    "Here's a basic implementation you can start with:\n\n```tsx\nimport { useState } from 'react';\n\ninterface FormData {\n  name: string;\n  email: string;\n}\n\nexport function MyForm() {\n  const [data, setData] = useState<FormData>({ name: '', email: '' });\n  const [errors, setErrors] = useState<Partial<FormData>>({});\n\n  const validate = () => {\n    const newErrors: Partial<FormData> = {};\n    if (!data.name) newErrors.name = 'Name is required';\n    if (!data.email.includes('@')) newErrors.email = 'Invalid email';\n    setErrors(newErrors);\n    return Object.keys(newErrors).length === 0;\n  };\n\n  const handleSubmit = (e: React.FormEvent) => {\n    e.preventDefault();\n    if (validate()) {\n      console.log('Submitted:', data);\n    }\n  };\n\n  return (\n    <form onSubmit={handleSubmit}>\n      <input\n        value={data.name}\n        onChange={(e) => setData({ ...data, name: e.target.value })}\n      />\n      {errors.name && <span>{errors.name}</span>}\n      {/* ... */}\n    </form>\n  );\n}\n```",
    Date.now() - 260000,
  ),
  createUserMessage(
    "msg_6",
    "That's exactly what I needed! Can you also add error styling?",
    Date.now() - 250000,
  ),
  createAssistantMessage(
    "msg_7",
    "Absolutely! You can add conditional CSS classes to show red borders and error messages. Here's the enhanced version with Tailwind classes for error states.",
    Date.now() - 240000,
  ),
];

const sessionDetailPattern = /\/oc\/session\/[^/]+$/;
const sessionMessagesPattern = /\/oc\/session\/[^/]+\/message$/;
const demoSession = { id: DEMO_SESSION_ID, title: "Demo Chat Session" };

function createMessageHandlers(messages: MockMessage[]) {
  return [
    http.get("/oc/session/status", () =>
      HttpResponse.json({ [DEMO_SESSION_ID]: { type: "idle" } }),
    ),
    http.get(sessionDetailPattern, () => HttpResponse.json(demoSession)),
    http.get(sessionMessagesPattern, async ({ request }) => {
      await delay(300);
      const hasBefore = new URL(request.url).searchParams.has("before");
      return HttpResponse.json(hasBefore ? [] : messages);
    }),
  ];
}

const errorHandlers = [
  http.get("/oc/session/status", () => HttpResponse.json({})),
  http.get(sessionDetailPattern, () => HttpResponse.json(demoSession)),
  http.get(sessionMessagesPattern, async () => {
    await delay(300);
    return HttpResponse.json(
      { message: "Failed to load messages (mock 500)" },
      { status: 500 },
    );
  }),
];

function SessionViewDialogDemo({
  scenario,
}: {
  scenario: "empty" | "single" | "multiple" | "loading" | "error";
}) {
  const [open, setOpen] = useState(true);

  const handleReset = () => {
    setOpen(false);
    setTimeout(() => setOpen(true), 100);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <p className="text-sm text-muted-foreground">
        Scenario: <code className="text-foreground">{scenario}</code>
      </p>
      <Button variant="outline" onClick={handleReset}>
        Reset demo
      </Button>
      <SessionViewDialog
        sessionId={DEMO_SESSION_ID}
        directory={DEMO_DIRECTORY}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 0 },
    mutations: { retry: false },
  },
});

const meta = preview.meta({
  title: "Chat/SessionViewDialog",
  component: SessionViewDialog,
  parameters: {
    layout: "fullscreen",
    msw: { handlers: createMessageHandlers(singleMessage) },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
});

export const Empty = meta.story({
  render: () => <SessionViewDialogDemo scenario="empty" />,
  parameters: {
    msw: { handlers: createMessageHandlers(emptyMessages) },
  },
});

export const WithSingleMessage = meta.story({
  render: () => <SessionViewDialogDemo scenario="single" />,
  parameters: {
    msw: { handlers: createMessageHandlers(singleMessage) },
  },
});

export const WithMultipleMessages = meta.story({
  render: () => <SessionViewDialogDemo scenario="multiple" />,
  parameters: {
    msw: { handlers: createMessageHandlers(multipleMessages) },
  },
});

export const Loading = meta.story({
  render: () => <SessionViewDialogDemo scenario="loading" />,
  parameters: {
    msw: { handlers: createMessageHandlers([]) },
  },
});

export const Error = meta.story({
  render: () => <SessionViewDialogDemo scenario="error" />,
  parameters: {
    msw: { handlers: errorHandlers },
  },
});
