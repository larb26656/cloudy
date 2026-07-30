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
  decorators: [
    (Story) => (
      <div className="mx-auto max-w-3xl p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MarkdownRenderer>;

// ---------------------------------------------------------------------------
// KITCHEN SINK — every element in one scrollable view, the main debug target.
// ---------------------------------------------------------------------------
const kitchenSink = `# H1 Heading

## H2 Heading

### H3 Heading

#### H4 Heading

##### H5 Heading

###### H6 Heading

---

## Paragraphs & Inline Formatting

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

This paragraph has **bold text**, _italic text_, ***bold italic***, ~~strikethrough~~, and \`inline code\`. You can also use [a link](https://example.com), and an autolink <https://example.com>.

A line with\`a hard break\`——actually use two trailing spaces:  
this should appear on a new line.

## Blockquote

> Single line blockquote.
>
> Multi-paragraph blockquote. This one has **bold** and _italic_ inside.
>
> > Nested blockquote with a [link](https://example.com) and \`code\`.

## Unordered List

- First item
- Second item with **bold**
- Third item with _italic_
  - Nested item A
  - Nested item B
    - Deeper nested item
- Fourth item

## Ordered List

1. First step
2. Second step with \`code\`
3. Third step
   1. Nested ordered A
   2. Nested ordered B
4. Fourth step

## Task List (GFM)

- [ ] Unchecked task
- [x] Checked task
- [ ] Another unchecked task
- [x] Completed item with ~~strikethrough~~

## Table (GFM)

| Feature        | Status | Notes                       |
| -------------- | :----: | --------------------------- |
| Headings       |   ✅   | Six levels supported        |
| Tables         |   ✅   | Aligned columns (left/ctr/right) |
| Task lists     |   ✅   | GitHub-flavored             |
| Code blocks    |   ✅   | Syntax highlighted          |

## Code Blocks

Inline code: \`const x = 42\`

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

async function getUsers(): Promise<User[]> {
  const response = await fetch("/api/users");
  return response.json();
}
\`\`\`

\`\`\`python
def fibonacci(n: int) -> list[int]:
    """Generate Fibonacci sequence up to n numbers."""
    if n <= 0:
        return []
    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])
    return sequence[:n]

print(fibonacci(10))
\`\`\`

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

\`\`\`json
{
  "name": "cloudy",
  "version": "1.0.0",
  "dependencies": {
    "react": "^19.0.0"
  }
}
\`\`\`

## Math (KaTeX)

Inline math: $E = mc^2$ and $\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$

Block math:

$$
\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
$$

$$
f(x) = a x^2 + b x + c
$$

## Mermaid Diagram

\`\`\`mermaid
flowchart LR
    A[Start] --> B{Decision}
    B -- Yes --> C[Action 1]
    B -- No --> D[Action 2]
    C --> E[End]
    D --> E
\`\`\`

## Horizontal Rule

Content above the rule.

---

Content below the rule.

## Links & Images

A [regular link](https://example.com), a [link with title](https://example.com "Example Title"), and an autolink <https://example.com>.

![Placeholder image](https://placehold.co/600x200?text=Markdown+Image)

## Mixed & Nested

> A blockquote containing a list:
>
> - Item inside quote
> - Another item
>   - Nested item
>
> And a code snippet:
>
> \`\`\`js
> console.log("inside quote");
> \`\`\`

1. List with a paragraph.
2. And a blockquote:
    > Quote inside list
3. And code:
    \`\`\`
    code in list
    \`\`\`

## Final Paragraph

End of the kitchen sink. _That's all the elements!_
`;

export const KitchenSink: Story = {
  name: "All Elements (Kitchen Sink)",
  args: {
    content: kitchenSink,
  },
};

// ---------------------------------------------------------------------------
// Per-element stories for granular style debugging.
// ---------------------------------------------------------------------------

export const Headings: Story = {
  args: {
    content: `# H1 Heading

## H2 Heading

### H3 Heading

#### H4 Heading

##### H5 Heading

###### H6 Heading

Paragraph after headings to check spacing.`,
  },
};

export const InlineFormatting: Story = {
  args: {
    content: `Inline formatting showcase:

- **Bold** and __also bold__
- _Italic_ and *also italic*
- ***Bold italic***
- ~~Strikethrough~~
- \`Inline code\`
- [Link](https://example.com)
- Autolink <https://example.com>

Combined: **bold with _italic_ and \`code\` inside** and a [**styled link**](https://example.com).`,
  },
};

export const Lists: Story = {
  args: {
    content: `## Unordered

- Item one
- Item two
  - Nested A
  - Nested B
    - Deeper
- Item three

## Ordered

1. First
2. Second
   1. Sub A
   2. Sub B
3. Third

## Mixed

1. Ordered top
   - Unordered nested
   - Another
2. Ordered again`,
  },
};

export const TaskList: Story = {
  args: {
    content: `## Task List

- [x] Completed task
- [ ] Pending task
- [x] Done with **bold**
- [ ] Todo with \`code\``,
  },
};

export const Table: Story = {
  args: {
    content: `## Aligned Columns

| Left aligned | Center aligned | Right aligned |
| :----------- | :------------: | ------------: |
| Left         |     Center     |        Right  |
| **Bold**     |    _Italic_    |      \`code\`  |
| Longer text  |   More text    |   Even more   |

## Simple Table

| Name  | Age | Role     |
| ----- | --- | -------- |
| Alice | 30  | Engineer |
| Bob   | 25  | Designer |`,
  },
};

export const Blockquote: Story = {
  args: {
    content: `> Single line blockquote.
>
> Multi-paragraph blockquote with **bold**, _italic_, and \`code\`.
>
> > Nested blockquote.
> >
> > Even deeper nesting with a [link](https://example.com).`,
  },
};

export const CodeBlocks: Story = {
  args: {
    content: `Inline code: \`const x = 42\`

\`\`\`typescript
interface User {
  id: number;
  name: string;
}

function getUser(id: number): Promise<User> {
  return fetch(\`/api/users/\${id}\`).then((res) => res.json());
}
\`\`\`

\`\`\`python
def fibonacci(n: int) -> list[int]:
    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])
    return sequence[:n]
\`\`\`

\`\`\`bash
npm install
npm run dev
\`\`\`

\`\`\`json
{ "name": "cloudy", "version": "1.0.0" }
\`\`\`

\`\`\`
Plain code block without language.
\`\`\``,
  },
};

export const LinksAndImages: Story = {
  args: {
    content: `## Links

- [Regular link](https://example.com)
- [Link with title](https://example.com "Example Title")
- Autolink: <https://example.com>
- Reference: [Cloudy][cloudy]

[cloudy]: https://example.com

## Image

![Placeholder](https://placehold.co/600x200?text=Markdown+Image)`,
  },
};

export const Math: Story = {
  args: {
    content: `## Inline Math

The famous equation $E = mc^2$, and $\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$.

## Block Math

$$
\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
$$

$$
f(x) = a x^2 + b x + c
$$`,
  },
};

export const Mermaid: Story = {
  args: {
    content: `## Flowchart

\`\`\`mermaid
flowchart LR
    A[Start] --> B{Decision}
    B -- Yes --> C[Action 1]
    B -- No --> D[Action 2]
    C --> E[End]
    D --> E
\`\`\`

## Sequence Diagram

\`\`\`mermaid
sequenceDiagram
    participant Client
    participant Server
    Client->>Server: Request
    Server-->>Client: Response
\`\`\``,
  },
};

export const HorizontalRule: Story = {
  args: {
    content: `Content above.

---

Content between rules.

***

Content after asterisk rule.

___

Content after underscore rule.`,
  },
};

export const NestedStructures: Story = {
  args: {
    content: `> Blockquote with a list:
>
> - Item one
> - Item two
>   - Nested
> - Item three
>
> And code:
>
> \`\`\`js
> console.log("in quote");
> \`\`\`

1. List with blockquote:
    > Quote inside list
2. With code:
    \`\`\`
    code inside list
    \`\`\`
3. With nested list:
    - Nested unordered
4. Done.`,
  },
};
