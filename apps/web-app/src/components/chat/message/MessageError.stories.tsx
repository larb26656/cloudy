import preview from "@/storybook/preview";
import { MessageError } from "./MessageError";

const meta = preview.meta({
  title: "Chat/Message/MessageError",
  component: MessageError,
  tags: ["autodocs"],
  argTypes: {
    error: {
      control: "object",
      description: "Error info from the assistant message (info.error)",
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl p-4">
        <Story />
      </div>
    ),
  ],
});

export default meta;

export const Aborted = meta.story({
  args: {
    error: {
      name: "MessageAbortedError",
      data: {
        message: "Aborted",
      },
    } as any,
  },
});

export const ProviderAuth = meta.story({
  args: {
    error: {
      name: "ProviderAuthError",
      data: {
        message: "Missing or invalid API key for provider.",
      },
    } as any,
  },
});

export const ContextOverflow = meta.story({
  args: {
    error: {
      name: "ContextOverflowError",
      data: {
        message: "The conversation exceeded the maximum context length.",
      },
    } as any,
  },
});

export const ContentFilter = meta.story({
  args: {
    error: {
      name: "ContentFilterError",
      data: {
        message: "The response was blocked by the content filter.",
      },
    } as any,
  },
});

export const OutputLength = meta.story({
  args: {
    error: {
      name: "MessageOutputLengthError",
      data: {},
    } as any,
  },
});

export const StructuredOutput = meta.story({
  args: {
    error: {
      name: "StructuredOutputError",
      data: {
        message: "Failed to produce valid structured output.",
        retries: 3,
      },
    } as any,
  },
});

export const ApiError = meta.story({
  args: {
    error: {
      name: "APIError",
      data: {
        message: "Internal server error",
        statusCode: 500,
        isRetryable: false,
      },
    } as any,
  },
});

export const Unknown = meta.story({
  args: {
    error: {
      name: "UnknownError",
      data: {
        message: "An unexpected error occurred.",
      },
    } as any,
  },
});
