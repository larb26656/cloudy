import { useState } from "react";
import { MoonIcon, SendIcon, SunIcon } from "lucide-react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import {
  MessageListView,
  type MessageDisplayItem,
} from "@repo/ui/components/message";
import { MessageScrollerProvider } from "@repo/ui/components/message-scroller";
import type { Message } from "@repo/ui/components/message/types";

const messages = [
  {
    info: {
      id: "user-1",
      role: "user",
      time: { created: Date.now() - 12_000 },
    },
    parts: [
      { type: "text", text: "Can this package render outside the main app?" },
    ],
  },
  {
    info: {
      id: "assistant-1",
      role: "assistant",
      time: { created: Date.now() - 8_000 },
    },
    parts: [
      {
        type: "reasoning",
        text: "The host app supplies data and the scrolling provider. The package owns the presentational tree.",
        time: { start: Date.now() - 8_000, end: Date.now() - 7_000 },
      },
      {
        type: "text",
        text: "Yes. This is a separate Vite app importing `@repo/ui` through its workspace exports.",
      },
      {
        type: "tool",
        tool: "bash",
        state: {
          status: "completed",
          input: { command: "pnpm --filter ui-playground build" },
          time: { start: Date.now() - 7_000, end: Date.now() - 6_000 },
        },
      },
    ],
  },
] as unknown as Message[];

const displayItems: MessageDisplayItem[] = messages.map((message) => ({
  id: message.info.id,
  kind: "remote",
  message,
}));

export function App() {
  const [dark, setDark] = useState(false);
  const [prompt, setPrompt] = useState("");

  return (
    <main
      className={
        dark ? "dark min-h-dvh bg-background" : "min-h-dvh bg-background"
      }
    >
      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-5 py-8 sm:px-8">
        <header className="mb-8 flex items-start justify-between border-b border-border pb-6">
          <div>
            <p className="mb-2 font-mono text-xs tracking-[0.24em] text-muted-foreground uppercase">
              Cloudy / Integration proof
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              UI package, outside the app.
            </h1>
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Toggle color theme"
            onClick={() => setDark((value) => !value)}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </Button>
        </header>

        <section className="grid flex-1 gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <Card size="sm" className="h-fit">
            <CardHeader>
              <CardTitle>Consumer setup</CardTitle>
              <CardDescription>
                This app does not import files from web-app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">React 19</Badge>
                <Badge variant="secondary">Vite</Badge>
                <Badge variant="secondary">shadcn</Badge>
              </div>
              <dl className="space-y-3 text-sm">
                <div className="border-l-2 border-primary pl-3">
                  <dt className="text-muted-foreground">Primitives</dt>
                  <dd className="font-medium">Button, Card, Badge, Input</dd>
                </div>
                <div className="border-l-2 border-primary pl-3">
                  <dt className="text-muted-foreground">Chat surface</dt>
                  <dd className="font-medium">MessageListView + provider</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="min-h-[34rem]">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Workspace package smoke test</CardTitle>
                  <CardDescription>
                    Mock data crosses the host/package boundary through props.
                  </CardDescription>
                </div>
                <Badge>live render</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col px-0">
              <MessageScrollerProvider autoScroll>
                <MessageListView
                  remoteMessages={messages}
                  displayItems={displayItems}
                  streamingCount={0}
                  isLoading={false}
                  error={null}
                  onRetry={() => {}}
                  sessionStatus={undefined}
                  isStreaming={false}
                  sessionError={undefined}
                  onDismissError={() => {}}
                  hasNextPage={false}
                  isFetchingNextPage={false}
                  onLoadMore={() => {}}
                  streamingMessage={() => null}
                />
              </MessageScrollerProvider>
              <form
                className="flex gap-2 border-t p-4"
                onSubmit={(event) => event.preventDefault()}
              >
                <Input
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Host-owned input; package-owned display"
                />
                <Button type="submit" size="icon" aria-label="Send mock prompt">
                  <SendIcon />
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
