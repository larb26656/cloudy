import type { Meta, StoryObj } from "@storybook/react";
import { Detail, Preview } from "./TodoToolInput";

const meta: Meta<typeof Preview> = {
  title: "Chat/Message/Parts/ToolComponents/TodoToolInput",
  component: Preview,
  tags: ["autodocs"],
};

export default meta;
type PreviewStory = StoryObj<typeof Preview>;
type DetailStory = StoryObj<typeof Detail>;

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

// ----------------------------------------------------------------------------
// Preview stories
// ----------------------------------------------------------------------------

export const PreviewFullList: PreviewStory = {
  name: "Preview - Full List",
  args: {
    state: {
      status: "completed",
      input: {
        content: "Plan: Implement auth feature",
        todos,
      },
    } as any,
  },
};

export const PreviewPending: PreviewStory = {
  name: "Preview - Pending (creating)",
  args: {
    state: {
      status: "pending",
      input: {
        content: "Creating todo...",
      },
    } as any,
  },
};

export const PreviewAllCompleted: PreviewStory = {
  name: "Preview - All Completed",
  args: {
    state: {
      status: "completed",
      input: {
        todos: todos.slice(0, 3).map((t) => ({ ...t, status: "completed" })),
      },
    } as any,
  },
};

export const PreviewManyTodos: PreviewStory = {
  name: "Preview - Many Todos (truncated)",
  args: {
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
};

export const PreviewMinimal: PreviewStory = {
  name: "Preview - Minimal (single todo)",
  args: {
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
};

// ----------------------------------------------------------------------------
// Detail stories
// ----------------------------------------------------------------------------

export const DetailFullList: DetailStory = {
  name: "Detail - Full List",
  args: {
    input: {
      content: "Plan: Implement auth feature",
      todos,
    },
  },
};

export const DetailContentOnly: DetailStory = {
  name: "Detail - Content Only",
  args: {
    input: {
      content: "Planning next steps...",
    },
  },
};

export const DetailNoPriority: DetailStory = {
  name: "Detail - Without Priority",
  args: {
    input: {
      todos: [
        { content: "Task without priority", status: "pending" },
        { content: "Another task", status: "in_progress" },
      ],
    },
  },
};

export const DetailEmpty: DetailStory = {
  name: "Detail - Empty",
  args: {
    input: {},
  },
};

// ----------------------------------------------------------------------------
// Narrow container + long text
// ----------------------------------------------------------------------------

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

export const PreviewNarrowLongText: PreviewStory = {
  name: "Preview - Narrow Container + Long Text",
  render: (args: React.ComponentProps<typeof Preview>) => (
    <div className="w-56 border border-dashed border-muted-foreground/30 rounded p-2">
      <Preview {...args} />
    </div>
  ),
  args: {
    state: {
      status: "running",
      input: {
        content: "Refactoring auth and session management system overhaul",
        todos: longTodos,
      },
    } as any,
  },
};

export const DetailNarrowLongText: DetailStory = {
  name: "Detail - Narrow Container + Long Text",
  render: (args: React.ComponentProps<typeof Detail>) => (
    <div className="w-56 border border-dashed border-muted-foreground/30 rounded p-2">
      <Detail {...args} />
    </div>
  ),
  args: {
    input: {
      content: "Refactoring auth and session management system overhaul",
      todos: longTodos,
    },
  },
};
