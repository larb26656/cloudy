import { tool } from "@opencode-ai/plugin";
import { listIdeas, createIdea, updateIdeaMeta, deleteIdea } from "../lib/api";

export const list = tool({
  description:
    "List all ideas with optional filters. Returns idea path, title, status, priority, tags, and content.",
  args: {
    q: tool.schema
      .string()
      .optional()
      .describe("Search query to filter ideas by title/content"),
    status: tool.schema
      .enum(["draft", "in-progress", "completed", "archived"])
      .optional()
      .describe("Filter by status"),
    priority: tool.schema
      .enum(["low", "medium", "high"])
      .optional()
      .describe("Filter by priority"),
    tags: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("Filter by tags"),
  },
  async execute(args) {
    const params = new URLSearchParams();
    if (args.q) params.set("q", args.q);
    if (args.status) params.set("status", args.status);
    if (args.priority) params.set("priority", args.priority);
    if (args.tags?.length) args.tags.forEach((t) => params.append("tags", t));

    const ideas = await listIdeas(params.toString());
    return JSON.stringify(ideas, null, 2);
  },
});

export const create = tool({
  description:
    "Create a new idea with title and optional metadata. Returns the created idea detail.",
  args: {
    title: tool.schema.string().describe("Title of the idea"),
    content: tool.schema
      .string()
      .optional()
      .describe("Initial content for the idea (markdown)"),
    tags: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("Tags for categorization"),
    status: tool.schema
      .enum(["draft", "in-progress", "completed", "archived"])
      .optional()
      .describe("Status (default: draft)"),
    priority: tool.schema
      .enum(["low", "medium", "high"])
      .optional()
      .describe("Priority (default: medium)"),
  },
  async execute(args) {
    const result = await createIdea(args);
    return `Idea created successfully:\n${JSON.stringify(result, null, 2)}`;
  },
});

export const update = tool({
  description:
    "Update idea metadata (title, tags, status, priority). Use the idea 'path' value as identifier.",
  args: {
    path: tool.schema
      .string()
      .describe("The idea path (identifier, e.g. '1743123456_my-idea')"),
    title: tool.schema.string().optional().describe("New title"),
    tags: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("Replace tags"),
    status: tool.schema
      .enum(["draft", "in-progress", "completed", "archived"])
      .optional()
      .describe("New status"),
    priority: tool.schema
      .enum(["low", "medium", "high"])
      .optional()
      .describe("New priority"),
  },
  async execute(args) {
    const { path: ideaPath, ...body } = args;
    const result = await updateIdeaMeta(ideaPath, body);
    return `Idea updated successfully:\n${JSON.stringify(result, null, 2)}`;
  },
});

export const remove = tool({
  description:
    "Delete an idea by its path. This removes the idea and all its files permanently.",
  args: {
    path: tool.schema
      .string()
      .describe("The idea path to delete (e.g. '1743123456_my-idea')"),
  },
  async execute(args) {
    await deleteIdea(args.path);
    return `Idea '${args.path}' deleted successfully.`;
  },
});
