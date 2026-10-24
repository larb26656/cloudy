import { toast } from "@repo/ui/components/sonner";
import { Button } from "@repo/ui/components/button";
import {
  useChatGPTPlanStatus,
  useCancelChatGPTPlan,
  useConnectChatGPTPlan,
  useDisconnectChatGPTPlan,
} from "@/hooks/queries/useLLMConnectionSettings";

export function ChatGPTPlanConnection() {
  const chatgpt = useChatGPTPlanStatus();
  const connectChatGPT = useConnectChatGPTPlan();
  const cancelChatGPT = useCancelChatGPTPlan();
  const disconnectChatGPT = useDisconnectChatGPTPlan();

  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
      <div>
        <h3 className="text-sm font-semibold">ChatGPT plan</h3>
        <p className="text-xs text-muted-foreground">
          {chatgpt.data?.connected
            ? `Connected${chatgpt.data.email ? ` as ${chatgpt.data.email}` : ""}`
            : chatgpt.data?.connecting
              ? "Waiting for ChatGPT sign-in..."
              : (chatgpt.data?.error ??
                "Use models included with your ChatGPT plan.")}
        </p>
      </div>
      {chatgpt.data?.connected ? (
        <Button
          variant="outline"
          disabled={disconnectChatGPT.isPending}
          onClick={() =>
            disconnectChatGPT.mutate(undefined, {
              onError: (err) => toast.error(err.message),
            })
          }
        >
          Disconnect
        </Button>
      ) : chatgpt.data?.connecting ? (
        <Button
          variant="outline"
          disabled={cancelChatGPT.isPending}
          onClick={() =>
            cancelChatGPT.mutate(undefined, {
              onError: (err) => toast.error(err.message),
            })
          }
        >
          Cancel sign-in
        </Button>
      ) : (
        <Button
          variant="outline"
          disabled={connectChatGPT.isPending}
          onClick={() =>
            connectChatGPT.mutate(undefined, {
              onError: (err) => toast.error(err.message),
            })
          }
        >
          Connect with ChatGPT
        </Button>
      )}
    </section>
  );
}
