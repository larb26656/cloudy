import preview from "@/storybook/preview";
import { TodoTool } from "./TodoTool";

const meta = preview.meta({
  title: "Chat/Message/Parts/ToolComponents/TodoTool",
  component: TodoTool,
  tags: ["autodocs"],
  argTypes: {
    tool: { control: "text", description: "Tool name" },
    state: {
      control: "object",
      description: "Tool state from SDK",
    },
  },
});

export default meta;

const todos = [
  {
    content: "Read the project documentation",
    status: "completed" as const,
    priority: "high" as const,
  },
  {
    content: "Set up the development environment",
    status: "completed" as const,
    priority: "high" as const,
  },
  {
    content: "Implement the authentication flow",
    status: "in_progress" as const,
    priority: "high" as const,
  },
  {
    content: "Write unit tests for the service layer",
    status: "pending" as const,
    priority: "medium" as const,
  },
  {
    content: "Refactor the database schema",
    status: "pending" as const,
    priority: "low" as const,
  },
  {
    content: "Deploy to staging environment",
    status: "cancelled" as const,
    priority: "low" as const,
  },
];

export const FullList = meta.story({
  args: {
    tool: "todowrite",
    state: {
      status: "completed",
      input: {
        content: "Plan: Implement auth feature",
        todos,
      },
    } as any,
  },
});

export const Pending = meta.story({
  name: "Pending (creating)",
  args: {
    tool: "todowrite",
    state: {
      status: "pending",
      input: {
        content: "Creating todo...",
      },
    } as any,
  },
});

export const AllCompleted = meta.story({
  args: {
    tool: "todowrite",
    state: {
      status: "completed",
      input: {
        todos: todos.slice(0, 3).map((t) => ({ ...t, status: "completed" })),
      },
    } as any,
  },
});

export const ManyTodos = meta.story({
  name: "Many Todos (truncated in preview)",
  args: {
    tool: "todowrite",
    state: {
      status: "running",
      input: {
        content: "Large backlog",
        todos: Array.from({ length: 10 }, (_, i) => ({
          content: `Task #${i + 1}`,
          status: i < 3 ? ("completed" as const) : ("pending" as const),
        })),
      },
    } as any,
  },
});

export const Minimal = meta.story({
  name: "Minimal (single todo)",
  args: {
    tool: "todowrite",
    state: {
      status: "completed",
      input: {
        todos: [
          {
            content: "Only one thing to do",
            status: "pending",
          },
        ],
      },
    } as any,
  },
});

const longTodos = [
  {
    content:
      "Refactor the authentication middleware to support OAuth2 with PKCE flow and migrate all existing session tokens to the new JWT format",
    status: "completed" as const,
    priority: "high" as const,
  },
  {
    content:
      "Update the database migration scripts to handle the new polymorphic relationship between users and organizations while preserving backward compatibility",
    status: "in_progress" as const,
    priority: "high" as const,
  },
  {
    content:
      "Write comprehensive integration tests covering edge cases such as concurrent updates, network failures, and partial rollbacks across distributed services",
    status: "pending" as const,
    priority: "medium" as const,
  },
];

export const NarrowContainerLongText = meta.story({
  name: "Narrow Container + Long Text",
  render: (args: React.ComponentProps<typeof TodoTool>) => (
    <div className="w-56 border border-dashed border-muted-foreground/30 rounded p-2">
      <TodoTool {...args} />
    </div>
  ),
  args: {
    tool: "todowrite",
    state: {
      status: "running",
      input: {
        content: "Refactoring auth and session management system overhaul",
        todos: longTodos,
      },
    } as any,
  },
});
