import preview from "../../../../.storybook/preview";
import { RetryMessage } from "./RetryMessage";

const meta = preview.meta({
  title: "Chat/Message/RetryMessage",
  component: RetryMessage,
  tags: ["autodocs"],
});

export const Default = meta.story({
  args: {
    message: "Connection failed",
    attempt: 1,
    next: Date.now() + 125000,
  },
});

export const ExpiringSoon = meta.story({
  args: {
    message: "Connection failed",
    attempt: 1,
    next: Date.now() + 3000,
  },
});

export const Expired = meta.story({
  args: {
    message: "Connection failed",
    attempt: 2,
    next: Date.now() - 1000,
  },
});
