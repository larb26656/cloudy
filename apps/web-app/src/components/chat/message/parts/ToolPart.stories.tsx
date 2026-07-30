import preview from "@/storybook/preview";
import { ToolPart } from "./ToolPart";

const meta = preview.meta({
  title: "Chat/Message/Parts/ToolPart",
  component: ToolPart,
  tags: ["autodocs"],
  argTypes: {
    part: {
      control: "object",
      description: "Tool part data from SDK",
    },
  },
});

export default meta;

export const Pending = meta.story({
  args: {
    part: {
      type: "tool",
      tool: "bash",
      state: {
        status: "pending",
        input: {
          command: "npm install",
          description: "Install dependencies",
        },
      },
    } as any,
  },
});

export const Running = meta.story({
  args: {
    part: {
      type: "tool",
      tool: "bash",
      state: {
        status: "running",
        title: "Installing packages...",
        input: {
          command: "npm install",
          workdir: "/project",
        },
        time: {
          start: Date.now() - 3000,
        },
      },
    } as any,
  },
});

export const Completed = meta.story({
  args: {
    part: {
      type: "tool",
      tool: "bash",
      state: {
        status: "completed",
        input: {
          command: "ls -la",
        },
        output: "total 64\ndrwxr-xr-x  12 user  staff   384 Mar 17 10:00 .\ndrwxr-xr-x   3 root  root    96 Mar 17 09:00 ..",
        time: {
          start: Date.now() - 5000,
          end: Date.now() - 2000,
        },
      },
    } as any,
  },
});

export const Error = meta.story({
  args: {
    part: {
      type: "tool",
      tool: "bash",
      state: {
        status: "error",
        input: {
          command: "npm run build",
        },
        error: "Error: Command failed with exit code 1\nENOENT: No such file or directory",
        time: {
          start: Date.now() - 10000,
          end: Date.now() - 8000,
        },
      },
    } as any,
  },
});

export const ReadTool = meta.story({
  args: {
    part: {
      type: "tool",
      tool: "read",
      state: {
        status: "completed",
        input: {
          filePath: "src/App.tsx",
          offset: 0,
          limit: 100,
        },
        output: "import React from 'react';\n\nexport function App() {\n  return <div>Hello</div>;\n}",
        time: {
          start: Date.now() - 2000,
          end: Date.now(),
        },
      },
    } as any,
  },
});

export const WriteTool = meta.story({
  args: {
    part: {
      type: "tool",
      tool: "write",
      state: {
        status: "completed",
        input: {
          filePath: "src/new-file.ts",
          content: "export const newFile = 'content';",
        },
        time: {
          start: Date.now() - 1000,
          end: Date.now(),
        },
      },
    } as any,
  },
});

export const EditTool = meta.story({
  args: {
    part: {
      type: "tool",
      tool: "edit",
      state: {
        status: "completed",
        input: {
          filePath: "src/App.tsx",
          oldString: "export function App() {",
          newString: "export function App({ name }: { name: string }) {",
        },
        time: {
          start: Date.now() - 500,
          end: Date.now(),
        },
      },
    } as any,
  },
});

export const GrepTool = meta.story({
  args: {
    part: {
      type: "tool",
      tool: "grep",
      state: {
        status: "completed",
        input: {
          pattern: "function\\s+\\w+",
          path: "src/",
          include: "*.ts",
        },
        output: "src/utils.ts:1:function add(a, b)\nsrc/App.tsx:5:function render()",
        time: {
          start: Date.now() - 3000,
          end: Date.now(),
        },
      },
    } as any,
  },
});

export const WebFetchTool = meta.story({
  args: {
    part: {
      type: "tool",
      tool: "webfetch",
      state: {
        status: "completed",
        input: {
          url: "https://api.github.com/users/octocat",
          format: "json",
        },
        output: '{"login": "octocat", "id": 1, "type": "User"}',
        time: {
          start: Date.now() - 5000,
          end: Date.now(),
        },
      },
    } as any,
  },
});

export const QuestionTool = meta.story({
  args: {
    part: {
      type: "tool",
      tool: "question",
      state: {
        status: "pending",
        input: {
          questions: [
            {
              question: "Which language do you prefer?",
              header: "Language",
              options: [
                { label: "TypeScript", description: "Strongly typed" },
                { label: "JavaScript", description: "More flexible" },
              ],
            },
          ],
        },
      },
    } as any,
  },
});

export const SkillTool = meta.story({
  args: {
    part: {
      type: "tool",
      tool: "skill",
      state: {
        status: "pending",
        input: {
          name: "frontend-design",
        },
      },
    } as any,
  },
});
