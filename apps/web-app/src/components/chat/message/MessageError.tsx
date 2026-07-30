import {
  OctagonX,
  ShieldAlert,
  MessageSquareWarning,
  Scissors,
  FilterX,
  BrainCog,
  ServerCrash,
} from "lucide-react";
import type { AssistantMessage } from "@opencode-ai/sdk/v2";
import type { LucideIcon } from "lucide-react";

type MessageErrorInfo = NonNullable<AssistantMessage["error"]>;

interface ErrorConfig {
  icon: LucideIcon;
  title: string;
  getDescription: (error: MessageErrorInfo) => string | null;
}

const ERROR_CONFIGS: Partial<Record<MessageErrorInfo["name"], ErrorConfig>> = {
  MessageAbortedError: {
    icon: OctagonX,
    title: "Stopped",
    getDescription: () => null,
  },
  ProviderAuthError: {
    icon: ShieldAlert,
    title: "Authentication error",
    getDescription: (error) =>
      error.name === "ProviderAuthError" ? (error.data.message ?? null) : null,
  },
  ContextOverflowError: {
    icon: MessageSquareWarning,
    title: "Context limit exceeded",
    getDescription: (error) =>
      error.name === "ContextOverflowError" ? (error.data.message ?? null) : null,
  },
  ContentFilterError: {
    icon: FilterX,
    title: "Content filtered",
    getDescription: (error) =>
      error.name === "ContentFilterError" ? (error.data.message ?? null) : null,
  },
  MessageOutputLengthError: {
    icon: Scissors,
    title: "Output length limit reached",
    getDescription: () => null,
  },
  StructuredOutputError: {
    icon: BrainCog,
    title: "Structured output failed",
    getDescription: (error) => {
      if (error.name !== "StructuredOutputError") return null;
      const { message, retries } = error.data;
      const parts = [message, retries !== undefined ? `${retries} retries` : null].filter(
        Boolean,
      );
      return parts.length > 0 ? parts.join(" · ") : null;
    },
  },
  APIError: {
    icon: ServerCrash,
    title: "Request failed",
    getDescription: (error) => {
      if (error.name !== "APIError") return null;
      const { message, statusCode } = error.data;
      return [statusCode ? String(statusCode) : null, message].filter(Boolean).join(": ");
    },
  },
  UnknownError: {
    icon: ServerCrash,
    title: "Something went wrong",
    getDescription: (error) =>
      error.name === "UnknownError" ? (error.data.message ?? null) : null,
  },
};

interface MessageErrorProps {
  error: MessageErrorInfo;
}

export function MessageError({ error }: MessageErrorProps) {
  const config = ERROR_CONFIGS[error.name] ?? {
    icon: ServerCrash,
    title: "Error",
    getDescription: () => null,
  };
  const { icon: Icon, title, getDescription } = config;
  const description = getDescription(error);

  return (
    <div className="flex items-start gap-2 py-1.5 text-sm text-muted-foreground">
      <Icon className="size-4 mt-0.5 shrink-0" />
      <div className="flex flex-col">
        <span className="font-medium">{title}</span>
        {description && <span className="text-xs">{description}</span>}
      </div>
    </div>
  );
}
