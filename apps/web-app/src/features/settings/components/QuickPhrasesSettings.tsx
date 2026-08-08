"use client";

import { useState } from "react";
import { Trash2, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useQuickPhrasesStore, MAX_PHRASES } from "@/stores/quickPhrasesStore";

export function QuickPhrasesSettings() {
  const phrases = useQuickPhrasesStore((s) => s.phrases);
  const addPhrase = useQuickPhrasesStore((s) => s.addPhrase);
  const removePhrase = useQuickPhrasesStore((s) => s.removePhrase);
  const updatePhrase = useQuickPhrasesStore((s) => s.updatePhrase);

  const [draft, setDraft] = useState("");

  const isFull = phrases.length >= MAX_PHRASES;

  const handleAdd = () => {
    if (!draft.trim() || isFull) return;
    addPhrase(draft);
    setDraft("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Quick Phrases</h2>
        <p className="text-sm text-muted-foreground">
          Set up to {MAX_PHRASES} quick phrases that appear as pills above the
          chat input when focused.
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
        <div className="space-y-2">
          {phrases.map((phrase, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg border p-2"
            >
              <Input
                value={phrase}
                onChange={(e) => updatePhrase(i, e.target.value)}
                className="border-none shadow-none focus-visible:ring-0"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removePhrase(i)}
                aria-label="Remove phrase"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
