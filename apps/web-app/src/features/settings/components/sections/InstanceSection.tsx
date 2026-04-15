import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useInstanceStore, type Instance } from "@/stores/instanceStore";
import { registerInstance } from "@/stores/instance/instanceScopeHook";
import { createWorkspaceStore } from "@/stores/workspaceStore";
import { Plus, Pencil, Trash2, Check } from "lucide-react";

export function InstanceSection() {
  const {
    instances,
    addInstance,
    removeInstance,
    updateInstance,
  } = useInstanceStore();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newEndpoint, setNewEndpoint] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const getWorkspaceCount = (instanceId: string): number => {
    try {
      const store = createWorkspaceStore(instanceId);
      return store.getState().workspaces.length;
    } catch {
      return 0;
    }
  };

  const handleAdd = () => {
    if (!newName.trim() || !newEndpoint.trim()) return;

    const instance = addInstance({
      name: newName.trim(),
      endpoint: newEndpoint.trim(),
    });
    registerInstance(instance);

    setNewName("");
    setNewEndpoint("");
    setIsAdding(false);
  };

  const handleEdit = (instance: Instance) => {
    setEditingId(instance.id);
    setNewName(instance.name);
    setNewEndpoint(instance.endpoint);
  };

  const handleSaveEdit = () => {
    if (!editingId || !newName.trim() || !newEndpoint.trim()) return;

    updateInstance(editingId, {
      name: newName.trim(),
      endpoint: newEndpoint.trim(),
    });

    registerInstance({
      id: editingId,
      name: newName.trim(),
      endpoint: newEndpoint.trim(),
      createdAt: instances.find(i => i.id === editingId)?.createdAt ?? Date.now(),
    });

    setEditingId(null);
    setNewName("");
    setNewEndpoint("");
  };

  const handleDelete = (id: string) => {
    const workspaceCount = getWorkspaceCount(id);
    if (workspaceCount > 0) {
      const store = createWorkspaceStore(id);
      const workspaces = store.getState().workspaces;
      for (const ws of workspaces) {
        store.getState().deleteWorkspace(ws.id);
      }
    }
    removeInstance(id);
    setDeleteConfirmId(null);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewName("");
    setNewEndpoint("");
  };

  const getDeleteDescription = (instanceId: string): string => {
    const workspaceCount = getWorkspaceCount(instanceId);
    if (workspaceCount > 0) {
      return `This instance has ${workspaceCount} workspace(s) that will also be deleted. Are you sure you want to delete?`;
    }
    return "Are you sure you want to delete this instance? This action cannot be undone.";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Instances</CardTitle>
          <CardDescription>Manage your instances</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {instances.length === 0 && !isAdding ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>No instances yet</p>
              <Button
                variant="link"
                onClick={() => setIsAdding(true)}
                className="mt-2"
              >
                <Plus className="size-4 mr-1" /> Add your first instance
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {instances.map((instance) => (
                <div
                  key={instance.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  {editingId === instance.id ? (
                    <div className="flex-1 space-y-2 mr-4">
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Instance name"
                        className="h-8"
                      />
                      <Input
                        value={newEndpoint}
                        onChange={(e) => setNewEndpoint(e.target.value)}
                        placeholder="http://localhost:4096"
                        className="h-8"
                      />
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{instance.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {instance.endpoint}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    {editingId === instance.id ? (
                      <>
                        <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                          <Check className="size-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancel}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(instance)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteConfirmId(instance.id)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {isAdding && (
                <div className="p-3 rounded-lg border space-y-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Instance name"
                    className="h-8"
                    autoFocus
                  />
                  <Input
                    value={newEndpoint}
                    onChange={(e) => setNewEndpoint(e.target.value)}
                    placeholder="http://localhost:4096"
                    className="h-8"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAdd}>
                      <Plus className="size-4 mr-1" /> Add
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {!isAdding && (
                <Button
                  variant="outline"
                  onClick={() => setIsAdding(true)}
                  className="w-full"
                >
                  <Plus className="size-4 mr-1" /> Add Instance
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        title="Delete Instance"
        description={deleteConfirmId ? getDeleteDescription(deleteConfirmId) : ""}
        confirmLabel="Delete"
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        destructive
      />
    </div>
  );
}