"use client";

import { useState, useCallback } from "react";
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useReplyPermission } from "@/hooks/queries/usePermissions";
import type { PermissionRequest } from "@opencode-ai/sdk/v2";

interface PermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: PermissionRequest[];
  directory: string;
}

export function PermissionDialog({
  open,
  onOpenChange,
  permissions,
  directory,
}: PermissionDialogProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const replyPermission = useReplyPermission();

  const isPending = replyPermission.isPending;
  const activePermission = permissions[activeIndex] ?? null;

  const resetState = useCallback(() => {
    setActiveIndex(0);
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const handleReply = async (reply: "once" | "always" | "reject") => {
    if (!activePermission) return;

    await replyPermission.mutateAsync({
      requestID: activePermission.id,
      reply,
      directory,
    });

    if (activeIndex >= permissions.length - 1) {
      onOpenChange(false);
      resetState();
    } else {
      setActiveIndex((prev) => prev + 1);
    }
  };

  if (!activePermission) return null;

  const getActionIcon = (permission: string) => {
    switch (permission.toLowerCase()) {
      case "read":
      case "list":
        return <Shield className="size-5 text-blue-500" />;
      case "edit":
      case "write":
        return <ShieldAlert className="size-5 text-amber-500" />;
      case "delete":
      case "remove":
        return <ShieldX className="size-5 text-red-500" />;
      default:
        return <Shield className="size-5 text-gray-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-red-500" />
            Permission Request {activeIndex + 1} of {permissions.length}
          </DialogTitle>
          <DialogDescription>
            The AI assistant is requesting permission to perform an action.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-4 p-1">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-start gap-3">
                {getActionIcon(activePermission.permission)}
                <div className="flex-1 space-y-2">
                  <div>
                    <div className="text-xs font-medium text-red-700 dark:text-red-300 uppercase mb-1">
                      Permission
                    </div>
                    <div className="font-medium text-sm">
                      {activePermission.permission}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-red-700 dark:text-red-300 uppercase mb-1">
                      Patterns
                    </div>
                    <div className="space-y-1">
                      {activePermission.patterns.map((pattern, idx) => (
                        <code
                          key={idx}
                          className="block text-xs bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded"
                        >
                          {pattern}
                        </code>
                      ))}
                    </div>
                  </div>

                  {activePermission.always && activePermission.always.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-red-700 dark:text-red-300 uppercase mb-1">
                        Always Allow
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-400">
                        {activePermission.always.join(", ")}
                      </div>
                    </div>
                  )}

                  {activePermission.tool && (
                    <div>
                      <div className="text-xs font-medium text-red-700 dark:text-red-300 uppercase mb-1">
                        Tool
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-400">
                        Message ID: {activePermission.tool.messageID}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex gap-2 w-full">
            <Button
              variant="ghost"
              onClick={() => handleReply("reject")}
              disabled={isPending}
              className="flex-1"
            >
              <ShieldX className="size-4 mr-1" />
              Deny
            </Button>
            <Button
              variant="outline"
              onClick={() => handleReply("once")}
              disabled={isPending}
              className="flex-1"
            >
              Allow Once
            </Button>
            <Button
              variant="default"
              onClick={() => handleReply("always")}
              disabled={isPending}
              className="flex-1"
            >
              <ShieldCheck className="size-4 mr-1" />
              Allow Always
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
