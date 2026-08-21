import { useState } from "react";
import { Folder, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PathText } from "@/components/ui/path-text";
import { isAbsoluteDirectory } from "@/lib/path";
import { useRecentDirectoryStore } from "@/stores/recentDirectoryStore";

interface QuickPathSectionProps {
  onPathSubmit: (directory: string) => void;
}

export function QuickPathSection({ onPathSubmit }: QuickPathSectionProps) {
  const paths = useRecentDirectoryStore((s) => s.paths);
  const removePath = useRecentDirectoryStore((s) => s.remove);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!isAbsoluteDirectory(trimmed)) {
      setError("Enter an absolute directory path");
      return;
    }
    onPathSubmit(trimmed);
  };

  return (
    <div className="flex flex-col gap-3">
      <form
        className="flex items-start gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="min-w-0 flex-1">
          <Input
            value={value}
            placeholder="/absolute/path/to/project"
            aria-label="Chat directory"
            aria-invalid={!!error}
            autoFocus
            className="font-mono text-sm"
            onChange={(event) => {
              setValue(event.target.value);
              setError(null);
            }}
          />
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
        <Button type="submit">Next</Button>
      </form>

      {paths.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="px-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            Recent
          </span>
          {paths.map((path) => (
            <div key={path} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onPathSubmit(path)}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
              >
                <Folder className="size-4 shrink-0 text-muted-foreground" />
                <PathText path={path} className="font-mono text-sm" />
              </button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove ${path}`}
                onClick={() => removePath(path)}
              >
                <X />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
