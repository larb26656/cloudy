// components/session/DirectoryFilter.tsx
import { useState } from 'react';
import { Folder, ChevronDown, X, History } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useSessionStore } from '../../stores/sessionStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function DirectoryFilter() {
  const { selectedDirectory, recentDirectories, setSelectedDirectory, addRecentDirectory } = useUIStore();
  const { loadSessions, setCurrentDirectory } = useSessionStore();
  const [isOpen, setIsOpen] = useState(false);
  const [customPath, setCustomPath] = useState('');

  const handleSelectDirectory = (directory: string | null) => {
    setSelectedDirectory(directory);
    setCurrentDirectory(directory);
    
    if (directory) {
      addRecentDirectory(directory);
    }
    
    loadSessions(directory);
    setIsOpen(false);
  };

  const handleCustomPathSubmit = () => {
    if (customPath.trim()) {
      handleSelectDirectory(customPath.trim());
      setCustomPath('');
    }
  };

  const displayPath = selectedDirectory 
    ? selectedDirectory.split('/').pop() || selectedDirectory
    : 'All Directories';

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-auto py-2 px-3">
          <div className="flex items-center gap-2 min-w-0">
            <Folder className="size-4 shrink-0" />
            <span className="truncate">{displayPath}</span>
          </div>
          <div className="flex items-center gap-1">
            {selectedDirectory && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectDirectory(null);
                }}
                className="p-1 hover:bg-accent rounded"
              >
                <X className="size-3" />
              </button>
            )}
            <ChevronDown className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[calc(100%-1rem)]">
        <DropdownMenuItem
          onClick={() => handleSelectDirectory(null)}
          className="gap-2"
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
                className="gap-2 truncate"
              >
                <Folder className="size-4 shrink-0" />
                <span className="truncate">{dir}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        <DropdownMenuSeparator />
        <div className="p-2">
          <div className="text-xs text-muted-foreground mb-1">Custom Path</div>
          <div className="flex gap-1">
            <Input
              placeholder="/path/to/project"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCustomPathSubmit();
                }
              }}
              className="h-8 text-sm"
            />
            <Button
              size="sm"
              onClick={handleCustomPathSubmit}
              disabled={!customPath.trim()}
              className="h-8 px-2"
            >
              Go
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
