import { ListTodo } from "lucide-react";
import type { ToolPart as ToolPartType } from "@opencode-ai/sdk/v2";
import { ToolPreviewLabel } from "../ToolPreviewLabel";
import { ToolValueRenderer } from "./ToolValueRenderer";

interface TodoItem {
  content: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high";
}

interface TodoToolInputProps {
  input: Record<string, unknown>;
}

export function Detail({ input }: TodoToolInputProps) {
  const todos = input.todos as TodoItem[] | undefined;
  const content = input.content as string | undefined;

  return (
    <div className="space-y-1.5 mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md">
      <div className="flex items-center gap-1.5 text-xs font-medium text-purple-700 dark:text-purple-300">
        <ListTodo className="size-3" />
        <span>Todo</span>
      </div>
      {content && (
        <div className="text-xs">
          <span className="text-muted-foreground">content:</span>{" "}
          <span className="font-medium">{content}</span>
        </div>
      )}
      {todos && todos.length > 0 && (
        <div className="space-y-1">
          {todos.map((todo, idx) => (
            <div key={idx} className="text-xs pl-2 border-l-2 border-purple-300 dark:border-purple-700">
              <div className="flex items-center gap-1.5">
                {todo.status && (
                  <span className={`size-1.5 rounded-full ${
                    todo.status === "completed" ? "bg-green-500" :
                    todo.status === "in_progress" ? "bg-yellow-500" :
                    todo.status === "cancelled" ? "bg-gray-400" :
                    "bg-purple-400"
                  }`} />
                )}
                <span>{todo.content}</span>
              </div>
              <div className="flex gap-2 mt-0.5 pl-3.5 text-[10px] text-muted-foreground">
                {todo.priority && (
                  <span>priority: <ToolValueRenderer value={todo.priority} keyName="priority" /></span>
                )}
                {todo.status && (
                  <span>status: <ToolValueRenderer value={todo.status} keyName="status" /></span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Preview({ state }: { state: ToolPartType["state"] }) {
  const todos = state.input.todos as TodoItem[] | undefined;
  const content = state.input.content as string | undefined;

  if (todos && todos.length > 0) {
    return (
      <div className="space-y-1">
        <ToolPreviewLabel
          icon={<ListTodo className="size-3" />}
          label={content || "Todo"}
        />
        <div className="pl-4 space-y-0.5">
          {todos.slice(0, 5).map((todo, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs">
              <div className={`size-3.5 rounded border flex items-center justify-center ${
                todo.status === "completed"
                  ? "bg-green-500 border-green-500"
                  : todo.status === "in_progress"
                    ? "bg-yellow-500 border-yellow-500"
                    : "border-muted-foreground"
              }`}>
                {todo.status === "completed" && (
                  <svg className="size-2.5 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className={todo.status === "completed" ? "line-through text-muted-foreground" : ""}>
                {todo.content}
              </span>
            </div>
          ))}
          {todos.length > 5 && (
            <div className="text-xs text-muted-foreground">+{todos.length - 5} more</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <ToolPreviewLabel
      icon={<ListTodo className="size-3" />}
      label={content || "Creating todo..."}
    />
  );
}
