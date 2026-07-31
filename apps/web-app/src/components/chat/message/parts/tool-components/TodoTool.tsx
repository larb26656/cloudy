import { Check, ListTodo } from "lucide-react";
import { ToolPreviewLabel } from "../ToolPreviewLabel";
import { ExpandableToolCard } from "./ExpandableToolCard";
import { ToolValueRenderer } from "./ToolValueRenderer";
import type { ToolComponentProps } from "./types";

interface TodoItem {
  content: string;
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high";
}

function TodoItems({
  todos,
  maxItems = Infinity,
  showBadges = false,
}: {
  todos: TodoItem[];
  maxItems?: number;
  showBadges?: boolean;
}) {
  const visible = todos.slice(0, maxItems);
  const remaining = todos.length - visible.length;

  return (
    <div className="space-y-0.5">
      {visible.map((todo, idx) => {
        const done = todo.status === "completed";
        const cancelled = todo.status === "cancelled";
        return (
          <div key={idx}>
            <div className="flex items-center gap-1.5 text-xs">
              <div
                className={`size-3.5 shrink-0 rounded border flex items-center justify-center ${
                  done
                    ? "bg-green-500 border-green-500"
                    : todo.status === "in_progress"
                      ? "bg-yellow-500 border-yellow-500"
                      : "border-muted-foreground"
                }`}
              >
                {done && <Check className="size-2.5 text-white" />}
              </div>
              <span
                className={`min-w-0 break-words ${done || cancelled ? "line-through text-muted-foreground" : ""}`}
              >
                {todo.content}
              </span>
            </div>
            {showBadges && (
              <div className="flex gap-2 mt-0.5 pl-5 text-[10px] text-muted-foreground">
                {todo.priority && (
                  <span>
                    priority:{" "}
                    <ToolValueRenderer
                      value={todo.priority}
                      keyName="priority"
                    />
                  </span>
                )}
                {todo.status && (
                  <span>
                    status:{" "}
                    <ToolValueRenderer value={todo.status} keyName="status" />
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
      {remaining > 0 && (
        <div className="text-xs text-muted-foreground">+{remaining} more</div>
      )}
    </div>
  );
}

export function TodoTool({ state }: ToolComponentProps) {
  const input = state.input;
  const todos = input.todos as TodoItem[] | undefined;
  const content = input.content as string | undefined;

  return (
    <ExpandableToolCard
      tool="todowrite"
      state={state}
      preview={
        todos && todos.length > 0 ? (
          <div className="space-y-1">
            <ToolPreviewLabel
              icon={<ListTodo className="size-3" />}
              label={content || "Todo"}
            />
            <div className="pl-4">
              <TodoItems todos={todos} maxItems={10} />
            </div>
          </div>
        ) : (
          <ToolPreviewLabel
            icon={<ListTodo className="size-3" />}
            label={content || "Creating todo..."}
          />
        )
      }
      detail={
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
          {todos && todos.length > 0 && <TodoItems todos={todos} showBadges />}
        </div>
      }
    />
  );
}
