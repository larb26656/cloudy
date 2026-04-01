import { useState } from "react";
import { Tag, X } from "lucide-react";

interface TagListProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export function TagList({ tags, onAddTag, onRemoveTag }: TagListProps) {
  const [newTag, setNewTag] = useState("");

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (tag && !tags.includes(tag)) {
      onAddTag(tag);
    }
    setNewTag("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground group"
        >
          <Tag className="size-3" />
          {tag}
          <button
            type="button"
            onClick={() => onRemoveTag(tag)}
            className="ml-0.5 hover:text-destructive"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={newTag}
        onChange={(e) => setNewTag(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleAddTag}
        placeholder="Add tag..."
        className="inline-flex h-7 w-24 items-center rounded-md bg-transparent px-1.5 py-0.5 text-xs text-muted-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
