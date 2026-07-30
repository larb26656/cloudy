import preview from "@/storybook/preview";
import { RetryPart } from "./RetryPart";

const meta = preview.meta({
  title: "Chat/Message/Parts/RetryPart",
  component: RetryPart,
  tags: ["autodocs"],
  argTypes: {
    part: {
      control: "object",
      description: "Retry part data from SDK",
    },
  },
});

export default meta;

export const Default = meta.story({
  args: {
    part: {
      type: "retry",
      attempt: 1,
      time: {
        created: Date.now() - 60000,
      },
      error: {
        data: {
          message: "Rate limit exceeded. Please wait before retrying.",
          statusCode: 429,
        },
      },
    } as any,
  },
});

export const MultipleAttempts = meta.story({
  args: {
    part: {
      type: "retry",
      attempt: 3,
      time: {
        created: Date.now() - 300000,
      },
      error: {
        data: {
          message: "Connection timeout",
          statusCode: 504,
        },
      },
    } as any,
  },
});
