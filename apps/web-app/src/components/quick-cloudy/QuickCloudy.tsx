import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { useCreateSession } from "@/hooks/queries/useSessions";
import { useSendMessage } from "@/hooks/queries/useMessages";
import { useDefaultModelStore } from "@/stores/defaultModelStore";
import { createSessionTabPayload } from "@/components/pet/openSessionTab";
import { quickBridge } from "@/lib/desktop/quickBridge";

export function QuickCloudy() {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const providerId = "cloudy";
  const model = useDefaultModelStore(
    (state) => state.defaultModels[providerId] ?? null,
  );
  const createSession = useCreateSession();
  const sendMessage = useSendMessage();

  useEffect(() => {
    inputRef.current?.focus();
    return quickBridge.onFocusInput(() => {
      requestAnimationFrame(() => inputRef.current?.focus());
    });
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") quickBridge.hide();
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter")
        void submit();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  async function submit() {
    const text = prompt.trim();
    if (!text || createSession.isPending || sendMessage.isPending) return;
    setError(null);
    setPrompt("");
    try {
      const session = await createSession.mutateAsync({
        directory: undefined,
        providerId,
        title: text.slice(0, 80),
        model: model ?? undefined,
      });
      quickBridge.openSession(
        createSessionTabPayload({
          providerId,
          sessionId: session.id,
          directory: session.directory,
          sessionName: session.title || text.slice(0, 80),
        }),
      );
      await sendMessage.mutateAsync({
        sessionId: session.id,
        content: { text, attachments: [], mentions: [] },
        directory: session.directory,
        providerId,
        model,
      });
      quickBridge.hide();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not send your question.",
      );
    }
  }

  const busy = createSession.isPending || sendMessage.isPending;
  return (
    <main className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b px-5 py-3">
        <span className="text-sm font-semibold">Quick Cloudy</span>
      </header>
      {error && (
        <p role="alert" className="px-5 pt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <form
        className="flex items-end gap-3 border-t p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <textarea
          ref={inputRef}
          autoFocus
          rows={2}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder="Ask Cloudy…"
          aria-label="Ask Cloudy"
          className="min-h-12 flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send"
          disabled={busy || !prompt.trim()}
        >
          <ArrowUp />
        </Button>
      </form>
    </main>
  );
}
