import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useInstanceStore, type Instance } from "@/stores/instanceStore";
import { registerInstance, getOC } from "@/stores/instance/instanceScopeHook";
import {
  WORKSPACE_COLORS,
  type WorkspaceColor,
} from "@/stores/workspaceStore";
import { createWorkspaceStore } from "@/stores/workspaceStore";
import { cn } from "@/lib/utils";
import { Folder, Loader2 } from "lucide-react";

type OnboardingProps = {
  onComplete?: (instance: Instance) => void;
};

type Step = "instance" | "workspace";

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>("instance");
  const [instanceName, setInstanceName] = useState("");
  const [endpoint, setEndpoint] = useState("http://localhost:4096");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceColor, setWorkspaceColor] = useState<WorkspaceColor>(WORKSPACE_COLORS[0]);
  const [workspaceDirectory, setWorkspaceDirectory] = useState("");
  const [directorySuggestions, setDirectorySuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [workspaceError, setWorkspaceError] = useState("");

  const [createdInstance, setCreatedInstance] = useState<Instance | null>(null);
  const [workspaceStore, setWorkspaceStore] = useState<ReturnType<typeof createWorkspaceStore> | null>(null);

  const { addInstance } = useInstanceStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleConnect = async () => {
    if (!instanceName.trim()) {
      setError("Please enter an instance name");
      return;
    }
    if (!endpoint.trim()) {
      setError("Please enter an endpoint");
      return;
    }

    setIsConnecting(true);
    setError("");

    try {
      const instance = addInstance({
        name: instanceName.trim(),
        endpoint: endpoint.trim(),
      });

      registerInstance(instance);
      setCreatedInstance(instance);
      const wsStore = createWorkspaceStore(instance.id);
      setWorkspaceStore(wsStore);
      setStep("workspace");
    } catch {
      setError("Failed to connect. Please check the endpoint.");
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (!workspaceDirectory.trim()) {
      setDirectorySuggestions([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      if (!createdInstance) return;
      setIsSearching(true);
      try {
        const oc = getOC(createdInstance.id);
        const result = await oc.find.files({
          query: workspaceDirectory,
          type: 'directory',
          limit: 10,
        });
        setDirectorySuggestions(result.data ?? []);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [workspaceDirectory, createdInstance]);

  const handleCreateWorkspace = () => {
    if (!workspaceName.trim()) {
      setWorkspaceError("Please enter a workspace name");
      return;
    }
    if (!workspaceDirectory.trim()) {
      setWorkspaceError("Please enter a directory path");
      return;
    }

    setIsCreatingWorkspace(true);
    setWorkspaceError("");

    try {
      if (!createdInstance) return;

      const workspace = workspaceStore?.getState().createWorkspace(createdInstance.id, {
        name: workspaceName.trim(),
        color: workspaceColor,
        directory: workspaceDirectory.trim(),
      });

      if (workspace) {
        workspaceStore?.getState().setCurrentWorkspace(workspace.id);
      }

      onComplete?.(createdInstance);
    } catch {
      setWorkspaceError("Failed to create workspace");
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  if (step === "workspace") {
    return (
      <div className="flex items-center justify-center min-h-full p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-4xl mb-4">🏢</div>
            <CardTitle className="text-2xl">Create Workspace</CardTitle>
            <CardDescription>Workspaces help organize your chats and memories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                placeholder="My Workspace"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
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
                    value={workspaceDirectory}
                    onChange={(e) => setWorkspaceDirectory(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {isSearching && (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    Searching...
                  </div>
                )}
                {!isSearching && directorySuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-md max-h-[200px] overflow-auto">
                    {directorySuggestions.map((dir) => (
                      <button
                        key={dir}
                        type="button"
                        onClick={() => {
                          setWorkspaceDirectory(dir);
                          setDirectorySuggestions([]);
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
                    onClick={() => setWorkspaceColor(c)}
                    className={cn(
                      "size-10 rounded-lg transition-all",
                      workspaceColor === c
                        ? "ring-2 ring-offset-2 ring-offset-background ring-foreground"
                        : "hover:scale-110",
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
            </div>

            {workspaceError && (
              <p className="text-sm text-destructive">{workspaceError}</p>
            )}

            <Button
              className="w-full"
              onClick={handleCreateWorkspace}
              disabled={isCreatingWorkspace}
            >
              {isCreatingWorkspace ? "Creating..." : "Create Workspace →"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-full p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-4xl mb-4">👋</div>
          <CardTitle className="text-2xl">Let's get started</CardTitle>
          <CardDescription>Add your first instance to begin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Instance Name</Label>
            <Input
              id="name"
              placeholder="My Server"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endpoint">Endpoint</Label>
            <Input
              id="endpoint"
              placeholder="http://localhost:4096"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            className="w-full"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting..." : "Connect →"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
