// components/session/DirectoryFilter.tsx
import { useState, useEffect, useRef } from "react";
import { Folder, ChevronDown, History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
} from "@/components/ui/command";
import { useStore, getStore } from "@/stores/instance";
import { cn } from "@/lib/utils";

interface DirectoryFilterProps {
  className?: string;
}

export function DirectoryFilter({ className }: DirectoryFilterProps) {
  const {
    selectedDirectory,
    recentDirectories,
    addRecentDirectory,
    searchDirectories,
    setSelectedDirectory,
  } = useStore("directory");

  const [isOpen, setIsOpen] = useState(false);
  const [customPath, setCustomPath] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        const results = getStore("directory").getState().directories;
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

  const handleSelectDirectory = (directory: string | null) => {
    setSelectedDirectory(directory);

    if (directory) {
      addRecentDirectory(directory);
    }

    setIsOpen(false);
    setCustomPath("");
    setSuggestions([]);
  };

  const handleCustomPathSubmit = () => {
    if (customPath.trim()) {
      handleSelectDirectory(customPath.trim());
    }
  };

  const handleSuggestionClick = (dir: string) => {
    handleSelectDirectory(dir);
  };

  const displayPath = selectedDirectory
    ? selectedDirectory.split("/").pop() || selectedDirectory
    : "All Directories";

  return (
    <div className={cn(["p-2", className])}>
      <DropdownMenu
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setCustomPath("");
            setSuggestions([]);
          }
        }}
      >
        <DropdownMenuTrigger className="w-full flex items-center justify-between h-auto py-2 px-3 rounded-md hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground">
          <div className="flex items-center gap-2 min-w-0">
            <Folder className="size-4 shrink-0" />
            <span className="truncate">{displayPath}</span>
          </div>
          <div className="flex items-center gap-1">
            {selectedDirectory && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectDirectory(null);
                }}
                className="p-1 hover:bg-accent rounded cursor-pointer"
              ></span>
            )}
            <ChevronDown
              className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[calc(100%-1rem)] p-0">
          <Command className="rounded-lg border-0 shadow-none">
            <CommandInput
              placeholder="/path/to/project"
              value={customPath}
              onValueChange={setCustomPath}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customPath.trim()) {
                  handleCustomPathSubmit();
                }
              }}
              className="h-9 text-sm"
            />
            <CommandList className="max-h-[300px]">
              {suggestions.length > 0 && (
                <>
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
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem
                onClick={() => handleSelectDirectory(null)}
                className="gap-2 cursor-pointer"
              >
                <Folder className="size-4" />
                All Directories
              </DropdownMenuItem>

              {recentDirectories.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1 text-xs text-muted-foreground flex items-center gap-1">
                    <History className="size-3" />
                    Recent
                  </div>
                  {recentDirectories.map((dir) => (
                    <DropdownMenuItem
                      key={dir}
                      onClick={() => handleSelectDirectory(dir)}
                      className="gap-2 truncate cursor-pointer"
                    >
                      <Folder className="size-4 shrink-0" />
                      <span className="truncate">{dir}</span>
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              {customPath && !isSearching && suggestions.length === 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-2">
                    <Button
                      size="sm"
                      onClick={handleCustomPathSubmit}
                      className="w-full h-8"
                    >
                      Use: {customPath}
                    </Button>
                  </div>
                </>
              )}

              {isSearching && (
                <div className="flex items-center justify-center py-2 gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span className="text-xs">Searching...</span>
                </div>
              )}
            </CommandList>
          </Command>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
