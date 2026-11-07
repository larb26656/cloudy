const categories: Record<string, true> = {
  read: true, grep: true, glob: true, webfetch: true, websearch: true,
  task: true, question: true, todowrite: true,
};

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function optional(value: unknown, type: "string" | "number"): boolean {
  return value === undefined || typeof value === type;
}

export function normalizeOtherTool(name: unknown, input: unknown): {
  name: string | undefined;
  input: unknown;
} | undefined {
  if (typeof name !== "string" || !Object.hasOwn(categories, name)) return undefined;
  if (!record(input)) return { name: undefined, input };
  let valid = false;
  switch (name) {
    case "read":
      valid = text(input.filePath) && optional(input.offset, "number") && optional(input.limit, "number");
      break;
    case "grep":
      valid = text(input.pattern) && optional(input.path, "string") && optional(input.include, "string");
      break;
    case "glob":
      valid = text(input.pattern) && optional(input.path, "string");
      break;
    case "webfetch":
      valid = text(input.url) && optional(input.format, "string") && optional(input.timeout, "number");
      break;
    case "websearch":
      valid = text(input.query);
      break;
    case "task":
      valid = text(input.agent) && text(input.description) && text(input.prompt);
      break;
    case "question":
      valid = Array.isArray(input.questions) && input.questions.length > 0 && input.questions.every((q: unknown) =>
        record(q) && text(q.question) && optional(q.header, "string") &&
        (q.options === undefined || (Array.isArray(q.options) && q.options.every((option: unknown) =>
          record(option) && text(option.label) && optional(option.description, "string"))));
      break;
    case "todowrite":
      valid = Array.isArray(input.todos) && input.todos.every((todo: unknown) =>
        record(todo) && text(todo.content) && optional(todo.status, "string") && optional(todo.priority, "string"));
      break;
  }
  return { name: valid ? name : undefined, input };
}
