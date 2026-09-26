import type { Message } from "@/types";
import preview from "../../../../.storybook/preview";
import { UserMessageBubble } from "@repo/ui/components/message";

const NOW = Date.now();

function makeMessage(text: string): Message {
  return {
    id: "msg-user-1",
    sessionId: "session-1",
    role: "user",
    createdAt: new Date(NOW).toISOString(),
    parts: [
      {
        id: "part-1",
        type: "text",
        text,
      },
    ],
  };
}

interface UserMessageBubbleStoryProps {
  width: number;
  message: Message;
}

function UserMessageBubbleStory({
  width,
  message,
}: UserMessageBubbleStoryProps) {
  return (
    <div
      style={{
        width: `${width}px`,
        maxWidth: "100%",
        border: "1px dashed #888",
        background: "#f5f5f5",
        padding: "12px",
      }}
    >
      <UserMessageBubble message={message} />
    </div>
  );
}

const meta = preview.meta({
  title: "Chat/Message/UserMessageBubble",
  component: UserMessageBubbleStory,
  tags: ["autodocs"],
  argTypes: {
    width: {
      control: { type: "range", min: 120, max: 900, step: 10 },
      description:
        "Width (px) of the surrounding chat pane. Shrink it to reproduce long-URL overflow.",
    },
  },
});

export default meta;

export const Default = meta.story({
  args: {
    width: 480,
    message: makeMessage(
      "@apps/web-app/src/components/markdown/MarkdownRenderer.tsx สร้าง storybook หน่อยเอาแบบ ให้เห็น ทุก element ใน markdown จะเอาไว้ debug ปรับ style",
    ),
  },
});

export const LongUnbreakableUrl = meta.story({
  args: {
    width: 480,
    message: makeMessage(
      "ดูลิงก์นี้ทะลุจอแน่ ๆ https://example.com/very/long/path/that/cannot/be/broken/by-whitespace-pre-wrap/abcdefghijklmnopqrstuvwxyz0123456789/this-url-never-wraps-and-overflows",
    ),
  },
});

export const NarrowContainer = meta.story({
  args: {
    width: 240,
    message: makeMessage(
      "@apps/web-app/src/components/markdown/MarkdownRenderer.tsx สร้าง storybook หน่อย\n\nhttps://example.com/some/super/long/unbreakable/url ทะลุจอเลย",
    ),
  },
});
