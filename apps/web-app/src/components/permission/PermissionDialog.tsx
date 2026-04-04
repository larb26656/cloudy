import { useState } from "react";
import { usePermissionStore, useDirectoryStore } from "@/stores";
import { useSessionStore } from "@cloudy/core-chat";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Shield, ShieldCheck, ShieldX, ShieldAlert } from "lucide-react";

interface PermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PermissionDialog({ open, onOpenChange }: PermissionDialogProps) {
  const { permissions, replyPermission } = usePermissionStore();
  const { sessions } = useSessionStore();
  const { selectedDirectory } = useDirectoryStore();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const permissionList = Object.entries(permissions);

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleReply = async (requestId: string, reply: "once" | "always" | "reject") => {
    if (!selectedDirectory) return;

    setIsSubmitting(true);
    await replyPermission(requestId, reply, selectedDirectory);
    setIsSubmitting(false);

    const remaining = permissions[selectedSessionId!];
    if (!remaining || remaining.length === 0) {
      setSelectedSessionId(null);
    }
  };

  const currentPermissions = selectedSessionId ? permissions[selectedSessionId] : null;
  const session = selectedSessionId
    ? sessions.find((s) => s.id === selectedSessionId)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Pending Permissions</DialogTitle>
          <DialogDescription>
            Select a session to manage permission requests from the AI assistant
          </DialogDescription>
        </DialogHeader>

        {!selectedSessionId ? (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {permissionList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No pending permissions
                </p>
              ) : (
                permissionList.map(([sessionId, sessionPermissions]) => (
                  <button
                    key={sessionId}
                    onClick={() => handleSelectSession(sessionId)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg border transition-colors",
                      "hover:bg-muted hover:border-muted-foreground/20",
                      "text-left"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium line-clamp-1">
                          {sessionPermissions[0].permission || "Permission Request"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {sessionPermissions.length} permission{sessionPermissions.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedSessionId(null)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back to sessions
              </button>
              {session && (
                <span className="text-xs text-muted-foreground">
                  {session.title}
                </span>
              )}
            </div>

            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-3">
                {currentPermissions?.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-blue-500 mt-0.5" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <p className="text-sm font-medium">{p.permission}</p>
                        {p.patterns && p.patterns.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {p.patterns.map((pattern, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 text-xs rounded-full bg-secondary"
                              >
                                {pattern}
                              </span>
                            ))}
                          </div>
                        )}
                        {p.always && p.always.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Already allowed: {p.always.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleReply(currentPermissions![0].id, "reject")}
                disabled={isSubmitting}
              >
                <ShieldX className="w-4 h-4 mr-1" />
                Reject
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleReply(currentPermissions![0].id, "once")}
                disabled={isSubmitting}
              >
                <ShieldAlert className="w-4 h-4 mr-1" />
                Allow Once
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => handleReply(currentPermissions![0].id, "always")}
                disabled={isSubmitting}
              >
                <ShieldCheck className="w-4 h-4 mr-1" />
                Always Allow
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}