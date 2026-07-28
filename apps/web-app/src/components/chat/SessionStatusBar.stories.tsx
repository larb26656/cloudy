import { useState } from "react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionStatusBar } from "./SessionStatusBar";
import preview from "../../../.storybook/preview";
import type { Session } from "@opencode-ai/sdk/v2";

const DEMO_DIRECTORY = "/demo/project";
const DEMO_SESSION_ID = "ses_demo_status";

type TokenShape = NonNullable<Session["tokens"]>;

function makeTokens(
  overrides: Partial<TokenShape> = {},
): TokenShape {
  return {
    input: 0,
    output: 0,
    reasoning: 0,
    cache: { read: 0, write: 0 },
    ...overrides,
  };
}

function makeSession(
  overrides: Partial<Pick<Session, "cost" | "tokens">>,
): Partial<Session> {
  return {
    id: DEMO_SESSION_ID,
    cost: overrides.cost ?? 0,
    tokens: overrides.tokens ?? makeTokens(),
  };
}

const sessionDetailPattern = /\/oc\/session\/[^/]+$/;

function createHandlers(session: Partial<Session>) {
  return [
    http.get("/oc/session/status", () => HttpResponse.json({})),
    http.get(sessionDetailPattern, () => HttpResponse.json(session)),
  ];
}

const fullSession = makeSession({
  cost: 0.012345,
  tokens: makeTokens({
    input: 12345,
    output: 6789,
    reasoning: 1024,
    cache: { read: 45678, write: 9012 },
  }),
});

const tokensOnlySession = makeSession({
  cost: 0,
  tokens: makeTokens({
    input: 8400,
    output: 3200,
    reasoning: 0,
    cache: { read: 0, write: 0 },
  }),
});

const costOnlySession = makeSession({
  cost: 0.0042,
  tokens: undefined,
});

const zeroSession = makeSession({ cost: 0, tokens: makeTokens() });

const largeSession = makeSession({
  cost: 1.234567,
  tokens: makeTokens({
    input: 1500000,
    output: 750000,
    reasoning: 250000,
    cache: { read: 4200000, write: 980000 },
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 0 },
    mutations: { retry: false },
  },
});

const meta = preview.meta({
  title: "Chat/SessionStatusBar",
  component: SessionStatusBar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    msw: { handlers: createHandlers(fullSession) },
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

function StatusBarInBox({ width }: { width: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-8">
      <p className="text-sm text-muted-foreground">
        Container width: <code className="text-foreground">{width}</code>
      </p>
      <div
        className="w-full border rounded-lg bg-background overflow-hidden"
        style={{ width }}
      >
        <SessionStatusBar
          sessionId={DEMO_SESSION_ID}
          directory={DEMO_DIRECTORY}
        />
      </div>
    </div>
  );
}

export const FullData = meta.story({
  parameters: { msw: { handlers: createHandlers(fullSession) } },
  render: () => <StatusBarInBox width="700px" />,
});

export const TokensOnly = meta.story({
  parameters: { msw: { handlers: createHandlers(tokensOnlySession) } },
  render: () => <StatusBarInBox width="700px" />,
});

export const CostOnly = meta.story({
  parameters: { msw: { handlers: createHandlers(costOnlySession) } },
  render: () => <StatusBarInBox width="700px" />,
});

export const LargeNumbers = meta.story({
  parameters: { msw: { handlers: createHandlers(largeSession) } },
  render: () => <StatusBarInBox width="700px" />,
});

export const NarrowContainer = meta.story({
  parameters: { msw: { handlers: createHandlers(fullSession) } },
  render: () => <StatusBarInBox width="300px" />,
});

export const EmptyWhenZero = meta.story({
  parameters: { msw: { handlers: createHandlers(zeroSession) } },
  render: () => <StatusBarInBox width="700px" />,
});

function ResizableContainer() {
  const [width, setWidth] = useState(320);
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <p className="text-sm text-muted-foreground">
        Drag to resize the container and watch the status bar adapt (switches at
        40rem / 640px container width).
      </p>
      <input
        type="range"
        min={240}
        max={960}
        value={width}
        onChange={(e) => setWidth(Number(e.target.value))}
        className="w-80"
      />
      <span className="text-xs tabular-nums">{width}px</span>
      <div
        className="border rounded-lg bg-background overflow-hidden transition-[width] duration-100"
        style={{ width: `${width}px` }}
      >
        <SessionStatusBar
          sessionId={DEMO_SESSION_ID}
          directory={DEMO_DIRECTORY}
        />
      </div>
    </div>
  );
}

export const Resizable = meta.story({
  parameters: { msw: { handlers: createHandlers(fullSession) } },
  render: () => <ResizableContainer />,
});
