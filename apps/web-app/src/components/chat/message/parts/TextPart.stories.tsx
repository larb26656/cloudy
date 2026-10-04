import { useEffect, useState } from "react";
import preview from "@/storybook/preview";
import { TextPart } from "@repo/ui/components/message";

const meta = preview.meta({
  title: "Chat/Message/Parts/TextPart",
  component: TextPart,
  tags: ["autodocs"],
  argTypes: {
    part: {
      control: "object",
      description: "Text part data from SDK",
    },
  },
});

export default meta;

const STREAMING_TEXT = `Streaming text reveals **word by word** with a slide-up animation.

- Each new word fades in as it arrives
- Already-visible content never re-animates
- Markdown still parses incrementally

\`\`\`ts
const answer = 42;
\`\`\`
`;

function StreamingTextDemo() {
  const words = STREAMING_TEXT.split(" ");
  const [count, setCount] = useState(1);
  const isStreaming = count < words.length;

  useEffect(() => {
    if (!isStreaming) return;
    const timer = setInterval(() => {
      setCount((c) => Math.min(c + 1, words.length));
    }, 90);
    return () => clearInterval(timer);
  }, [isStreaming, words.length]);

  return (
    <TextPart
      part={{ type: "text", text: words.slice(0, count).join(" ") } as any}
      isStreaming={isStreaming}
    />
  );
}

export const Streaming = meta.story({
  parameters: {
    docs: {
      description: {
        story:
          "Simulates a streaming response appending one word at a time to preview the word-level reveal animation.",
      },
    },
  },
  render: () => <StreamingTextDemo />,
});

export const Default = meta.story({
  args: {
    part: {
      type: "text",
      text: "Hello, this is a sample text response from the AI assistant.",
    } as any,
  },
});

export const WithSynthetic = meta.story({
  args: {
    part: {
      type: "text",
      text: "This is a synthetic message.",
      synthetic: true,
    } as any,
  },
});

export const WithIgnored = meta.story({
  args: {
    part: {
      type: "text",
      text: "This message was ignored.",
      ignored: true,
    } as any,
  },
});

export const WithMarkdown = meta.story({
  args: {
    part: {
      type: "text",
      text: "This is **bold** and this is _italic_. \n\n- List item 1\n- List item 2\n\n`const x = 1`",
    } as any,
  },
});
