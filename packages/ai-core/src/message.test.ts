import type { MessagePart } from "./message";

export const messagePartFixtures = [
  { id: "text", type: "text", text: "hello" },
  { id: "reasoning", type: "reasoning", text: "thinking" },
  { id: "tool", type: "tool", toolName: "search", status: "completed" },
  { id: "file", type: "file", path: "src/index.ts" },
  { id: "diff", type: "diff", path: "src/index.ts", patch: "@@" },
  { id: "subtask", type: "subtask", description: "delegate" },
  { id: "compaction", type: "compaction", summary: "summary" },
  { id: "unknown", type: "unknown", providerType: "vendor.part", data: {} },
] satisfies MessagePart[];
