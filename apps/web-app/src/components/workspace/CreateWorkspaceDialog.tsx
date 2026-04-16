import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  WORKSPACE_COLORS,
  type WorkspaceColor,
} from "@/stores/workspaceStore";
import { useInstanceStore } from "@/stores/instanceStore";
import { getOC } from "@/stores/instance/instanceScopeHook";
import { cn } from "@/lib/utils";
import { Folder, Loader2, Server } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspaceStore.new";

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const { instances } = useInstanceStore();

  const [selectedInstanceId, setSelectedInstanceId] = useState<string>("");
  const [name, setName] = useState("");
  const [color, setColor] = useState<WorkspaceColor>(WORKSPACE_COLORS[0]);
  const [directory, setDirectory] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const workspaceStore = useWorkspaceStore();

  useEffect(() => {
    if (instances.length > 0 && !selectedInstanceId) {
      setSelectedInstanceId(instances[0].id);
    }
  }, [instances, selectedInstanceId]);

  useEffect(() => {
    if (!directory.trim() || !selectedInstanceId) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const oc = getOC(selectedInstanceId);
        const result = await oc.find.files({
          query: directory,
          type: 'directory',
          limit: 10,
        });
        setSuggestions(result.data ?? []);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [directory, selectedInstanceId]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstanceId) {
      setError("Please select an instance");
      return;
    }
    if (!name.trim()) {
      setError("Please enter a workspace name");
      return;
    }
    if (!directory.trim()) {
      setError("Please enter a directory path");
      return;
    }
    if (!workspaceStore) {
      setError("Invalid instance");
      return;
    }

    workspaceStore.createWorkspace(
      selectedInstanceId,
      {
        name: name.trim(),
        color,
        directory: directory.trim(),
      },
      true,
    );

    // TODO use form instead
    setName("");
    setColor(WORKSPACE_COLORS[0]);
    setDirectory("");
    setSuggestions([]);
    setError("");
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName("");
      setColor(WORKSPACE_COLORS[0]);
      setDirectory("");
      setSuggestions([]);
      setError("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            Create a new workspace to organize your chats and memories.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-instance">Instance</Label>
            <div className="relative">
              <Server className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <select
                id="workspace-instance"
                value={selectedInstanceId}
                onChange={(e) => setSelectedInstanceId(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm"
              >
                {instances.map((instance) => (
                  <option key={instance.id} value={instance.id}>
                    {instance.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Name</Label>
            <Input
              id="workspace-name"
              placeholder="My Workspace"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workspace-directory">Directory</Label>
            <div className="relative">
              <div className="relative">
                <Folder className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="workspace-directory"
                  placeholder="/path/to/project"
                  value={directory}
                  onChange={(e) => setDirectory(e.target.value)}
                  className="pl-9"
                />
              </div>
              {isSearching && (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Searching...
                </div>
              )}
              {!isSearching && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-md max-h-[200px] overflow-auto">
                  {suggestions.map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => {
                        setDirectory(dir);
                        setSuggestions([]);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                    >
                      <Folder className="size-4 shrink-0" />
                      <span className="truncate">{dir}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-4 gap-2">
              {WORKSPACE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "size-10 rounded-lg transition-all",
                    color === c
                      ? "ring-2 ring-offset-2 ring-offset-background ring-foreground"
                      : "hover:scale-110",
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
