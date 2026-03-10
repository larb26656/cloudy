// components/chat/FileMentionDropdown.tsx
import { useState, useEffect } from 'react';
import { FileText, FileCode, FileJson, FileType, Loader2 } from 'lucide-react';
import { useFileSearch } from '../../hooks';
import type { FileReference } from '../../types';
import { Command, CommandInput, CommandList, CommandItem } from '@/components/ui/command';

interface FileMentionDropdownProps {
  directory: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (files: FileReference[]) => void;
}

const fileIcons: Record<string, React.ReactNode> = {
  js: <FileCode className="size-4 text-yellow-500" />,
  ts: <FileCode className="size-4 text-blue-500" />,
  jsx: <FileCode className="size-4 text-cyan-500" />,
  tsx: <FileCode className="size-4 text-blue-400" />,
  json: <FileJson className="size-4 text-muted-foreground" />,
  md: <FileType className="size-4 text-gray-700" />,
  css: <FileType className="size-4 text-blue-600" />,
  scss: <FileType className="size-4 text-pink-500" />,
  html: <FileType className="size-4 text-orange-500" />,
  py: <FileCode className="size-4 text-green-500" />,
  go: <FileCode className="size-4 text-cyan-600" />,
  rs: <FileCode className="size-4 text-orange-600" />,
  java: <FileCode className="size-4 text-red-500" />,
  default: <FileText className="size-4 text-muted-foreground" />,
};

function getFileIcon(extension: string) {
  return fileIcons[extension.toLowerCase()] || fileIcons.default;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileMentionDropdown({
  directory,
  isOpen,
  onClose,
  onSelect,
}: FileMentionDropdownProps) {
  const [query, setQuery] = useState('');
  const { results, isLoading, search, clearResults } = useFileSearch(directory, { maxResults: 10 });

  useEffect(() => {
    if (query.trim()) {
      search(query);
    } else {
      clearResults();
    }
  }, [query, search, clearResults]);

  useEffect(() => {
    if (!isOpen) {
      clearResults();
    }
  }, [isOpen, clearResults]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  const handleSelect = (file: FileReference) => {
    onSelect([file]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute left-0 right-0 bottom-full mb-2 z-50">
      <Command className="w-full">
        <CommandInput
          placeholder="Search files..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : !query.trim() ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Type to search for files
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No files found
            </div>
          ) : (
            results.map((file) => {
              const pathParts = file.path.split('/');
              const fileName = pathParts.pop() || file.name;
              const directoryPath = pathParts.join('/');

              return (
                <CommandItem
                  key={file.path}
                  onSelect={() => handleSelect(file)}
                  className="flex items-center gap-3"
                >
                  {getFileIcon(file.extension)}
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{fileName}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {directoryPath && (
                        <span className="text-muted-foreground">{directoryPath}/</span>
                      )}
                      <span>{fileName}</span>
                      <span className="ml-2 text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  </div>
                </CommandItem>
              );
            })
          )}
        </CommandList>
        <div className="px-3 py-2 bg-muted/50 border-t text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>Enter Select</span>
          </div>
          <span>Esc Close</span>
        </div>
      </Command>
    </div>
  );
}
