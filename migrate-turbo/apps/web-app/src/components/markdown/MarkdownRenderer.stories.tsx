import type { Meta, StoryObj } from "@storybook/react";
import { MarkdownRenderer } from "./MarkdownRenderer";

const meta: Meta<typeof MarkdownRenderer> = {
  title: "Markdown/MarkdownRenderer",
  component: MarkdownRenderer,
  tags: ["autodocs"],
  argTypes: {
    content: {
      control: "text",
      description: "Markdown content to render",
    },
  },
};

export default meta;
type Story = StoryObj<typeof MarkdownRenderer>;

export const Default: Story = {
  args: {
    content: "# Hello World\n\nThis is a **bold** text and this is _italic_.\n\n- Item 1\n- Item 2\n- Item 3\n\n## Code Example\n\nInline code: `const x = 42`\n\nCode block:\n\n```javascript\nfunction greet(name) {\n  console.log(`Hello, ${name}!`);\n}\n```",
  },
};

export const WithTable: Story = {
  args: {
    content: `## Features\n\n| Feature | Status |\n|---------|--------|\n| Markdown | ✅ |\n| Code Blocks | ✅ |\n| Tables | ✅ |\n| Lists | ✅ |`,
  },
};

export const WithBlockquote: Story = {
  args: {
    content: `> This is a blockquote with important information.\n\nYou can use it for:\n\n- Highlights\n- Notes\n- Warnings`,
  },
};

export const ComplexDocument: Story = {
  args: {
    content: `# API Documentation

## Endpoints

### GET /api/users

Returns a list of users.

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

async function getUsers(): Promise<User[]> {
  const response = await fetch('/api/users');
  return response.json();
}
\`\`\`

## Error Handling

| Error Code | Description |
|------------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |

> **Note:** Always validate input on the client side before sending to the server.

## Authentication

\`\`\`javascript
const token = localStorage.getItem('auth_token');

fetch('/api/protected', {
  headers: {
    'Authorization': \`Bearer \${token}\`
  }
});
\`\`\`
`,
  },
};
