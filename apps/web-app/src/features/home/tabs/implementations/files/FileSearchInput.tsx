import { useEffect, useMemo, useState } from "react";
import { debounce } from "lodash-es";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FileSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function FileSearchInput({ value, onChange }: FileSearchInputProps) {
  const [local, setLocal] = useState(value);

  const debouncedChange = useMemo(
    () => debounce((next: string) => onChange(next), 300),
    [onChange],
  );

  useEffect(() => {
    return () => debouncedChange.cancel();
  }, [debouncedChange]);

  const handleChange = (next: string) => {
    setLocal(next);
    debouncedChange(next);
  };

  const handleClear = () => {
    setLocal("");
    debouncedChange.cancel();
    onChange("");
  };

  return (
    <div className="flex items-center gap-2 border-b px-3 py-2">
      <div className="relative flex-1">
        <Search
          data-icon
          className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="text"
          value={local}
          placeholder="Search files by name…"
          onChange={(e) => handleChange(e.target.value)}
          className="h-8 pl-7 pr-7 text-xs"
        />
        {local && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleClear}
            title="Clear search"
            className="absolute right-1 top-1/2 size-6 -translate-y-1/2"
          >
            <X data-icon className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
