interface QuickPhrasesBarProps {
  phrases: string[];
  onSelect: (phrase: string) => void;
}

export function QuickPhrasesBar({ phrases, onSelect }: QuickPhrasesBarProps) {
  if (phrases.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {phrases.map((phrase, i) => (
        <button
          key={i}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelect(phrase)}
          className="shrink-0 rounded-full border bg-background px-3 py-1 text-xs text-foreground transition-colors hover:bg-accent"
        >
          {phrase}
        </button>
      ))}
    </div>
  );
}
