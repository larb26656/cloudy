// components/session/DirectoryPicker.tsx

import { useState, useEffect, useRef } from "react";
import { Folder, History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useDirectoryStore } from "@/stores";

interface DirectoryPickerProps {
  value?: string | null;
  onChange?: (directory: string | null) => void;
  placeholder?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DirectoryPicker({
  value,
  onChange,
  open,
  onOpenChange,
}: DirectoryPickerProps) {
  const { recentDirectories, addRecentDirectory, searchDirectories } =
    useDirectoryStore();

  const [isOpen, setIsOpen] = useState(false);
  const [customPath, setCustomPath] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  useEffect(() => {
    if (value !== undefined) {
      setCustomPath(value || "");
    }
  }, [value]);

  useEffect(() => {
    if (!customPath.trim()) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        await searchDirectories(customPath);
        const results = useDirectoryStore.getState().directories;
        setSuggestions(results);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [customPath, searchDirectories]);

  const handleClose = () => {
    setIsOpen(false);
    onOpenChange?.(false);
    setCustomPath(value || "");
    setSuggestions([]);
  };

  const handleCustomPathSubmit = () => {
    if (customPath.trim()) {
      addRecentDirectory(customPath.trim());
      onChange?.(customPath.trim());
      handleClose();
    }
  };

  const handleSuggestionClick = (dir: string) => {
    addRecentDirectory(dir);
    onChange?.(dir);
    handleClose();
  };

  // const displayPath = value ? value.split("/").pop() || value : placeholder;

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
        else setIsOpen(true);
      }}
      title="Select Directory"
      description="Choose a directory for your session"
    >
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="/path/to/project"
          value={customPath}
          onValueChange={setCustomPath}
          onKeyDown={(e) => {
            if (e.key === "Enter" && customPath.trim()) {
              handleCustomPathSubmit();
            }
          }}
        />
        <CommandList>
          {isSearching && (
            <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>Searching...</span>
            </div>
          )}

          {!isSearching &&
            suggestions.length === 0 &&
            customPath.trim() === "" &&
            recentDirectories.length === 0 && (
              <CommandEmpty>
                Start typing to search for a directory
              </CommandEmpty>
            )}

          {!isSearching && suggestions.length > 0 && (
            <CommandGroup heading="Search Results">
              {suggestions.map((dir) => (
                <CommandItem
                  key={dir}
                  value={dir}
                  onSelect={() => handleSuggestionClick(dir)}
                  className="gap-2 truncate cursor-pointer"
                >
                  <Folder className="size-4 shrink-0" />
                  <span className="truncate">{dir}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {!isSearching && customPath && suggestions.length === 0 && (
            <CommandEmpty>No directories found</CommandEmpty>
          )}

          {!isSearching && customPath.trim() && suggestions.length === 0 && (
            <div className="px-4 py-3">
              <Button
                size="sm"
                onClick={handleCustomPathSubmit}
                className="w-full"
              >
                Use: {customPath}
              </Button>
            </div>
          )}

          {recentDirectories.length > 0 && !customPath && (
            <CommandGroup heading="Recent">
              {recentDirectories.map((dir) => (
                <CommandItem
                  key={dir}
                  value={dir}
                  onSelect={() => handleSuggestionClick(dir)}
                  className="gap-2 truncate cursor-pointer"
                >
                  <History className="size-4 shrink-0" />
                  <span className="truncate">{dir}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
