import { useReactFlow } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";
import { X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { WindowFrame } from "../WindowFrame";

type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
};

type TodoNodeProps = Node<{ items: TodoItem[] }, "todo">;

export function TodoNode({ data, id, selected }: NodeProps<TodoNodeProps>) {
  const { updateNodeData } = useReactFlow();
  const [inputValue, setInputValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const items = useMemo(() => data.items ?? [], [data.items]);

  const handleAdd = useCallback(() => {
    if (!inputValue.trim()) return;
    const newItem: TodoItem = {
      id: crypto.randomUUID(),
      text: inputValue.trim(),
      completed: false,
    };
    updateNodeData(id, { items: [...items, newItem] });
    setInputValue("");
  }, [id, inputValue, items, updateNodeData]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAdd();
      }
    },
    [handleAdd],
  );

  const handleToggle = useCallback(
    (itemId: string) => {
      const newItems = items.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item,
      );
      updateNodeData(id, { items: newItems });
    },
    [id, items, updateNodeData],
  );

  const handleDelete = useCallback(
    (itemId: string) => {
      const newItems = items.filter((item) => item.id !== itemId);
      updateNodeData(id, { items: newItems });
    },
    [id, items, updateNodeData],
  );

  const handleStartEdit = useCallback((item: TodoItem) => {
    setEditingId(item.id);
    setEditValue(item.text);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingId || !editValue.trim()) {
      setEditingId(null);
      return;
    }
    const newItems = items.map((item) =>
      item.id === editingId ? { ...item, text: editValue.trim() } : item,
    );
    updateNodeData(id, { items: newItems });
    setEditingId(null);
  }, [editingId, editValue, id, items, updateNodeData]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSaveEdit();
      } else if (e.key === "Escape") {
        handleCancelEdit();
      }
    },
    [handleCancelEdit, handleSaveEdit],
  );

  return (
    <WindowFrame
      title="Todo List"
      nodeId={id}
      selected={selected}
      minWidth={200}
      minHeight={200}
      maxWidth={500}
      maxHeight={600}
    >
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b p-2">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a task..."
            className="h-8 flex-1"
          />
          <Button size="sm" onClick={handleAdd} disabled={!inputValue.trim()}>
            Add
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
          {items.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No tasks yet
            </p>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "group flex items-center gap-2 rounded p-1.5 hover:bg-muted",
                item.completed && "opacity-60",
              )}
            >
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => handleToggle(item.id)}
              />

              {editingId === item.id ? (
                <div className="flex flex-1 items-center gap-1">
                  <Input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    autoFocus
                    className="h-7 flex-1"
                  />
                  <Button size="xs" onClick={handleSaveEdit}>
                    Save
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <span
                    onClick={() => handleStartEdit(item)}
                    className={cn(
                      "flex-1 cursor-pointer truncate text-sm",
                      item.completed
                        ? "text-muted-foreground line-through"
                        : "text-foreground",
                    )}
                  >
                    {item.text}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => handleDelete(item.id)}
                  >
                    <X className="text-destructive" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </WindowFrame>
  );
}
