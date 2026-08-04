import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { http, HttpResponse } from "msw";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { MessageList } from "./MessageList";
import { MessageScrollerProvider } from "@/components/ui/message-scroller";
import { useStreamingMessagesStore } from "@/stores/streamingMessagesStore";
import { sessionKeys } from "@/lib/opencode/query-keys";
import preview from "../../../../.storybook/preview";
import type { Message } from "@/types";
import type {
  AssistantMessage,
  Part,
  SessionStatus,
  UserMessage,
} from "@opencode-ai/sdk/v2";

const SESSION_ID = "ses_story_stream";
const DIRECTORY = "/demo/project";
const NOW = Date.now();

let msgCounter = 0;
let partCounter = 0;
const nextMsgId = () => `msg-stream-${++msgCounter}`;
const nextPartId = () => `part-stream-${++partCounter}`;

function makeAssistantInfo(id: string): AssistantMessage {
  return {
    id,
    sessionID: SESSION_ID,
    role: "assistant",
    time: { created: Date.now() },
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
}

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
    text: "Show me what you can do! Stream some markdown and use some tools.",
  };
  return { info, parts: [textPart as Part] };
}

function makeToolPart(
  messageId: string,
  tool: string,
  input: Record<string, unknown>,
  output?: string,
  error?: string,
): Part {
  const id = nextPartId();
  const base: Record<string, unknown> = {
    id,
    sessionID: SESSION_ID,
    messageID: messageId,
    type: "tool",
    tool,
    state: {
      status: output || error ? "completed" : "pending",
      input,
      ...(output ? { output } : {}),
      ...(error ? { error } : {}),
      time: {
        start: Date.now() - 2000,
        end: Date.now() - 1000,
      },
    },
  };
  return base as Part;
}

function makeReasoningPart(messageId: string, text: string): Part {
  return {
    id: nextPartId(),
    sessionID: SESSION_ID,
    messageID: messageId,
    type: "reasoning",
    text,
    time: { start: Date.now() - 3000, end: Date.now() },
  } as Part;
}

function tokenize(text: string): string[] {
  return text.match(/\S+\s*|\s+/g) ?? [text];
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const idleStatus: Record<string, SessionStatus> = {
  [SESSION_ID]: { type: "idle" },
};

function createHandlers() {
  return [
    http.get("*/oc/session/status", () => HttpResponse.json(idleStatus)),
    http.get(`*/oc/session/${SESSION_ID}/message`, () =>
      HttpResponse.json([makeUserMessage()]),
    ),
  ];
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
    mutations: { retry: false },
  },
});

/* ------------------------------------------------------------------ */
/*  Content templates                                                  */
/* ------------------------------------------------------------------ */

const MARKDOWN_KITCHEN_SINK = `## Markdown Showcase

Here's a response with **various** markdown elements to test rendering:

### Text Formatting

- **Bold** and *italic* and ***both***
- \`inline code\` and ~~strikethrough~~
- [A link to nowhere](https://example.com)

### Ordered List

1. First item with some \`code\`
2. Second item
   - Nested unordered
   - Another nested
3. Third item

### Blockquote

> This is a blockquote.
> It spans multiple lines.

### Code Block

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}
\`\`\`

### Table

| Feature | Status | Notes |
|---------|--------|-------|
| Streaming | Done | Token-by-token |
| Markdown | Full | All elements |
| Virtualization | On | \`@tanstack/react-virtual\` |

That's the full kitchen sink.`;

const CODE_EXPLANATION = `Here's a React component with an explanation:

\`\`\`tsx
import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount((c) => c + 1)}>
      Count: {count}
    </button>
  );
}
\`\`\`

This demonstrates:

1. **State management** via \`useState\`
2. **Functional updates** with \`setCount((c) => c + 1)\`
3. **Event handling** through \`onClick\`

Each click increments by one.`;

const SHORT_ANSWER = `Great question! **React 19** introduces several improvements:

- \`use\` hook for promises and context
- Improved Suspense for data fetching
- Better error boundaries
- Native document metadata support

Want me to dive deeper into any of these?`;

const TOOL_ANSWER_BEFORE = `Let me check the project structure first.\n\n`;

const TOOL_ANSWER_AFTER = `The project has \`App.tsx\` and \`main.tsx\` as entry points.

Let me also create a new utility file:

\`\`\`typescript
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
\`\`\`

This utility formats dates in a human-readable way using the **Intl API**.`;

/* ------------------------------------------------------------------ */
/*  Interactive Simulator                                              */
/* ------------------------------------------------------------------ */

function ScenarioButton({
  children,
  onClick,
  disabled,
  variant,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost" | "secondary";
}) {
  return (
    <Button
      size="sm"
      variant={variant ?? "outline"}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}

function StreamingSimulator() {
  const qc = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [speed, setSpeed] = useState(25);
  const cancelledRef = useRef(false);

  const setStatus = useCallback(
    (status: SessionStatus) => {
      qc.setQueryData(sessionKeys.statuses(DIRECTORY), {
        [SESSION_ID]: status,
      });
    },
    [qc],
  );

  const reset = useCallback(() => {
    cancelledRef.current = true;
    useStreamingMessagesStore.setState({ streamingMessages: new Map() });
    setStatus({ type: "idle" });
    setIsStreaming(false);
    setTimeout(() => {
      cancelledRef.current = false;
    }, 50);
  }, [setStatus]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const streamTokens = useCallback(
    async (msgId: string, partId: string, text: string, delayMs: number) => {
      const tokens = tokenize(text);
      const store = useStreamingMessagesStore.getState();
      for (const token of tokens) {
        if (cancelledRef.current) return;
        store.onMessagePartDeltaUpdated(SESSION_ID, msgId, partId, token);
        await wait(delayMs);
      }
    },
    [],
  );

  const runScenario = useCallback(
    async (runner: () => Promise<void>) => {
      cancelledRef.current = false;
      useStreamingMessagesStore.setState({ streamingMessages: new Map() });
      setIsStreaming(true);
      setStatus({ type: "busy" });
      try {
        await runner();
      } finally {
        if (!cancelledRef.current) {
          setStatus({ type: "idle" });
          setIsStreaming(false);
        }
      }
    },
    [setStatus],
  );

  /* ---- Scenarios ---- */

  const runMarkdown = useCallback(() => {
    runScenario(async () => {
      const msgId = nextMsgId();
      const partId = nextPartId();
      await wait(800);
      if (cancelledRef.current) return;
      useStreamingMessagesStore.getState().onMessageInfoUpdated(SESSION_ID, {
        info: makeAssistantInfo(msgId),
        parts: [],
      });
      await streamTokens(msgId, partId, MARKDOWN_KITCHEN_SINK, speed);
    });
  }, [runScenario, streamTokens, speed]);

  const runCode = useCallback(() => {
    runScenario(async () => {
      const msgId = nextMsgId();
      const partId = nextPartId();
      await wait(800);
      if (cancelledRef.current) return;
      useStreamingMessagesStore.getState().onMessageInfoUpdated(SESSION_ID, {
        info: makeAssistantInfo(msgId),
        parts: [],
      });
      await streamTokens(msgId, partId, CODE_EXPLANATION, speed);
    });
  }, [runScenario, streamTokens, speed]);

  const runShort = useCallback(() => {
    runScenario(async () => {
      const msgId = nextMsgId();
      const partId = nextPartId();
      await wait(800);
      if (cancelledRef.current) return;
      useStreamingMessagesStore.getState().onMessageInfoUpdated(SESSION_ID, {
        info: makeAssistantInfo(msgId),
        parts: [],
      });
      await streamTokens(msgId, partId, SHORT_ANSWER, speed);
    });
  }, [runScenario, streamTokens, speed]);

  const runWithTools = useCallback(() => {
    runScenario(async () => {
      const msgId = nextMsgId();
      await wait(800);
      if (cancelledRef.current) return;
      useStreamingMessagesStore.getState().onMessageInfoUpdated(SESSION_ID, {
        info: makeAssistantInfo(msgId),
        parts: [],
      });

      const part1 = nextPartId();
      await streamTokens(msgId, part1, TOOL_ANSWER_BEFORE, speed);
      if (cancelledRef.current) return;

      const toolPart = makeToolPart(
        msgId,
        "bash",
        { command: "ls -la src/" },
        "drwxr-xr-x  10 user  staff   320 Jul 30 10:00 .\n-rw-r--r--   1 user  staff  1234 Jul 30 09:00 App.tsx\n-rw-r--r--   1 user  staff   567 Jul 30 09:00 main.tsx",
      );
      useStreamingMessagesStore
        .getState()
        .onMessagePartUpdated(SESSION_ID, toolPart);
      await wait(400);
      if (cancelledRef.current) return;

      const writePart = makeToolPart(
        msgId,
        "write",
        {
          filePath: "src/utils/formatDate.ts",
          content:
            'export function formatDate(date: Date): string {\n  return new Intl.DateTimeFormat("en-US").format(date);\n}',
        },
        undefined,
      );
      useStreamingMessagesStore
        .getState()
        .onMessagePartUpdated(SESSION_ID, writePart);
      await wait(400);
      if (cancelledRef.current) return;

      const part2 = nextPartId();
      await streamTokens(msgId, part2, TOOL_ANSWER_AFTER, speed);
    });
  }, [runScenario, streamTokens, speed]);

  const runReasoning = useCallback(() => {
    runScenario(async () => {
      const msgId = nextMsgId();
      await wait(800);
      if (cancelledRef.current) return;
      useStreamingMessagesStore.getState().onMessageInfoUpdated(SESSION_ID, {
        info: makeAssistantInfo(msgId),
        parts: [],
      });

      const reasoningPart = makeReasoningPart(
        msgId,
        "The user wants to see reasoning + streaming. I'll show my thought process first, then provide the answer with markdown formatting.",
      );
      useStreamingMessagesStore
        .getState()
        .onMessagePartUpdated(SESSION_ID, reasoningPart);
      await wait(500);
      if (cancelledRef.current) return;

      const textPartId = nextPartId();
      await streamTokens(msgId, textPartId, SHORT_ANSWER, speed);
    });
  }, [runScenario, streamTokens, speed]);

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b bg-muted/30 px-4 py-2.5 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold mr-1">Simulate Stream:</span>

        <ScenarioButton onClick={runMarkdown} disabled={isStreaming}>
          Markdown Kitchen Sink
        </ScenarioButton>
        <ScenarioButton onClick={runCode} disabled={isStreaming}>
          Code + Explanation
        </ScenarioButton>
        <ScenarioButton onClick={runWithTools} disabled={isStreaming}>
          With Tool Calls
        </ScenarioButton>
        <ScenarioButton onClick={runReasoning} disabled={isStreaming}>
          Reasoning + Answer
        </ScenarioButton>
        <ScenarioButton onClick={runShort} disabled={isStreaming}>
          Short Answer
        </ScenarioButton>

        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-xs text-muted-foreground">Speed</span>
          <input
            type="range"
            min={5}
            max={100}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-24"
            disabled={isStreaming}
          />
          <span className="text-xs tabular-nums w-10">{speed}ms</span>
        </div>

        <ScenarioButton onClick={reset} disabled={!isStreaming} variant="ghost">
          Reset
        </ScenarioButton>

        {isStreaming && (
          <span className="text-xs text-muted-foreground ml-1 animate-pulse">
            streaming...
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0 flex">
        <MessageScrollerProvider autoScroll>
          <MessageList
            selectedSessionId={SESSION_ID}
            directory={DIRECTORY}
            isShowEmptyState={false}
          />
        </MessageScrollerProvider>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Story export                                                       */
/* ------------------------------------------------------------------ */

const meta = preview.meta({
  title: "Chat/Message/MessageList",
  component: MessageList,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
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
  render: () => <StreamingSimulator />,
});
