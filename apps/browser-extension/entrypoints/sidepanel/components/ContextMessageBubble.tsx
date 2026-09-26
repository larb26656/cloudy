import { Globe, Quote } from "lucide-react";
import { MessageBubble } from "@repo/ui/components/message";
import type { Message } from "@repo/ui/components/message/types";
import {
  formatContextAttachmentSize,
  getInjectedContexts,
  removeInjectedContextParts,
} from "../lib/opencode/context";

interface ContextMessageBubbleProps {
  message: Message;
}

function ContextCard({
  context,
}: {
  context: ReturnType<typeof getInjectedContexts>[number];
}) {
  const Icon = context.kind === "page" ? Globe : Quote;
  const label =
    context.kind === "page"
      ? context.title || context.sourceUrl || "Page context"
      : "Selected text";

  return (
    <details className="context-message" data-context-kind={context.kind}>
      <summary className="context-message-summary">
        <Icon className="size-3.5 shrink-0" />
        <span className="truncate">{label}</span>
        <span className="context-message-size">
          {formatContextAttachmentSize(context.content)}
        </span>
      </summary>
      <div className="context-message-content">{context.content}</div>
    </details>
  );
}

export function ContextMessageBubble({ message }: ContextMessageBubbleProps) {
  const contexts = getInjectedContexts(message);
  const displayMessage = removeInjectedContextParts(message);

  return (
    <div data-message-id={message.info.id} className="context-message-group">
      {contexts.map((context, index) => (
        <ContextCard
          key={`${message.info.id}-context-${index}`}
          context={context}
        />
      ))}
      {displayMessage && <MessageBubble message={displayMessage} />}
    </div>
  );
}
