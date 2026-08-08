"use client";

import { useState, type CSSProperties } from "react";
import { Trash2, MessageSquareText, GripVertical } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { useQuickPhrasesStore, MAX_PHRASES } from "@/stores/quickPhrasesStore";

export function QuickPhrasesSettings() {
  const phrases = useQuickPhrasesStore((s) => s.phrases);
  const addPhrase = useQuickPhrasesStore((s) => s.addPhrase);
  const removePhrase = useQuickPhrasesStore((s) => s.removePhrase);
  const updatePhrase = useQuickPhrasesStore((s) => s.updatePhrase);
  const reorderPhrases = useQuickPhrasesStore((s) => s.reorderPhrases);

  const [draft, setDraft] = useState("");

  const isFull = phrases.length >= MAX_PHRASES;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleAdd = () => {
    if (!draft.trim() || isFull) return;
    addPhrase(draft);
    setDraft("");
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    reorderPhrases(active.id as number, over.id as number);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Quick Phrases</h2>
        <p className="text-sm text-muted-foreground">
          Set up to {MAX_PHRASES} quick phrases that appear as pills above the
          chat input when focused. Drag the handle to reorder.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {phrases.length} / {MAX_PHRASES}
        </span>
      </div>

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Type a phrase and press Enter..."
          disabled={isFull}
        />
        <Button onClick={handleAdd} disabled={!draft.trim() || isFull}>
          Add
        </Button>
      </div>

      {phrases.length === 0 ? (
        <EmptyState
          size="compact"
          icon={MessageSquareText}
          title="No quick phrases yet"
          description="Add phrases you use frequently for one-tap access while chatting."
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={phrases.map((_, i) => i)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {phrases.map((phrase, i) => (
                <SortablePhraseRow
                  key={i}
                  index={i}
                  phrase={phrase}
                  onUpdate={(text) => updatePhrase(i, text)}
                  onRemove={() => removePhrase(i)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

interface SortablePhraseRowProps {
  index: number;
  phrase: string;
  onUpdate: (text: string) => void;
  onRemove: () => void;
}

function SortablePhraseRow({
  index,
  phrase,
  onUpdate,
  onRemove,
}: SortablePhraseRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: index });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-lg border p-2",
        isDragging && "z-10 shadow-md",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label="Drag to reorder"
        className="flex cursor-grab touch-none items-center text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <Input
        value={phrase}
        onChange={(e) => onUpdate(e.target.value)}
        className="border-none shadow-none focus-visible:ring-0"
      />
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
        aria-label="Remove phrase"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
