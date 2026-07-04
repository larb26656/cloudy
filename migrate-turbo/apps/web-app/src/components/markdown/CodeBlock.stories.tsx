import type { Meta, StoryObj } from "@storybook/react";
import { MarkdownRenderer } from "./MarkdownRenderer";

const meta: Meta<typeof MarkdownRenderer> = {
  title: "Markdown/CodeBlock",
  component: MarkdownRenderer,
  tags: ["autodocs"],
  argTypes: {
    content: {
      control: "text",
      description: "Markdown content with code blocks",
    },
  },
};

export default meta;
type Story = StoryObj<typeof MarkdownRenderer>;

export const JavaScriptCode: Story = {
  args: {
    content: `Here is some JavaScript code:

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return true;
}

const result = greet("World");
\`\`\`

And here is some inline code: \`const x = 42\``,
  },
};

export const TypeScriptCode: Story = {
  args: {
    content: `\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function getUser(id: number): Promise<User> {
  return fetch(\`/api/users/\${id}\`)
    .then(res => res.json());
}
\`\`\``,
  },
};

export const PythonCode: Story = {
  args: {
    content: `\`\`\`python
def fibonacci(n: int) -> list[int]:
    """Generate Fibonacci sequence up to n numbers."""
    if n <= 0:
        return []
    
    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])
    
    return sequence[:n]

# Usage
print(fibonacci(10))
\`\`\``,
  },
};

export const JSONCode: Story = {
  args: {
    content: `\`\`\`json
{
  "name": "cloudy-webapp",
  "version": "1.0.0",
  "dependencies": {
    "react": "^19.0.0",
    "highlight.js": "^11.9.0",
    "diff2html": "^3.4.0"
  }
}
\`\`\``,
  },
};

export const BashCode: Story = {
  args: {
    content: `\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
\`\`\``,
  },
};

export const NoLanguage: Story = {
  args: {
    content: `\`\`\`
This is a code block without a specified language.
It will still be highlighted automatically.
\`\`\``,
  },
};

export const MixedContent: Story = {
  args: {
    content: `# Getting Started

To install the package, run:

\`\`\`bash
npm install my-package
\`\`\`

## Usage

Import and use it in your code:

\`\`\`javascript
import { myFunction } from 'my-package';

const result = myFunction({
  option1: true,
  option2: 'value'
});

console.log(result);
\`\`\`

### Notes

> This is a blockquote with important information.

- First item
- Second item
- Third item
`,
  },
};
