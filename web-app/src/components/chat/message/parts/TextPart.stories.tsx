import type { Meta, StoryObj } from "@storybook/react";
import { TextPart } from "./TextPart";

const meta: Meta<typeof TextPart> = {
  title: "Chat/Message/Parts/TextPart",
  component: TextPart,
  tags: ["autodocs"],
  argTypes: {
    part: {
      control: "object",
      description: "Text part data from SDK",
    },
  },
};

export default meta;
type Story = StoryObj<typeof TextPart>;

export const Default: Story = {
  args: {
    part: {
      type: "text",
      text: "Hello, this is a sample text response from the AI assistant.",
    } as any,
  },
};

export const WithSynthetic: Story = {
  args: {
    part: {
      type: "text",
      text: "This is a synthetic message.",
      synthetic: true,
    } as any,
  },
};

export const WithIgnored: Story = {
  args: {
    part: {
      type: "text",
      text: "This message was ignored.",
      ignored: true,
    } as any,
  },
};

export const WithMarkdown: Story = {
  args: {
    part: {
      type: "text",
      text: "This is **bold** and this is _italic_. \n\n- List item 1\n- List item 2\n\n`const x = 1`",
    } as any,
  },
};
