import type { UserMessage, Part } from "@opencode-ai/sdk/v2";
import preview from "../../../../.storybook/preview";
import UserMessageBubble from "./UserMessageBubble";

const NOW = Date.now();

const sampleInfo: UserMessage = {
  id: "msg-user-1",
  sessionID: "session-1",
  role: "user",
  time: { created: NOW },
  agent: "build",
  model: { providerID: "anthropic", modelID: "claude-sonnet" },
};

function textPart(text: string): Part {
  return {
    id: "part-1",
    sessionID: "session-1",
    messageID: "msg-user-1",
    type: "text",
    text,
  } as Part;
}

interface UserMessageBubbleStoryProps {
  width: number;
  info: UserMessage;
  parts: Part[];
}

function UserMessageBubbleStory({ width, info, parts }: UserMessageBubbleStoryProps) {
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
      <UserMessageBubble info={info} parts={parts} />
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
    info: sampleInfo,
    parts: [
      textPart(
        "@apps/web-app/src/components/markdown/MarkdownRenderer.tsx สร้าง storybook หน่อยเอาแบบ ให้เห็น ทุก element ใน markdown จะเอาไว้ debug ปรับ style",
      ),
    ],
  },
});

export const LongUnbreakableUrl = meta.story({
  args: {
    width: 480,
    info: sampleInfo,
    parts: [
      textPart(
        "ดูลิงก์นี้ทะลุจอแน่ ๆ https://example.com/very/long/path/that/cannot/be/broken/by-whitespace-pre-wrap/abcdefghijklmnopqrstuvwxyz0123456789/this-url-never-wraps-and-overflows",
      ),
    ],
  },
});

export const NarrowContainer = meta.story({
  args: {
    width: 240,
    info: sampleInfo,
    parts: [
      textPart(
        "@apps/web-app/src/components/markdown/MarkdownRenderer.tsx สร้าง storybook หน่อย\n\nhttps://example.com/some/super/long/unbreakable/url ทะลุจอเลย",
      ),
    ],
  },
});
