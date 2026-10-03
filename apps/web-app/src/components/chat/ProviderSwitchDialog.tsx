import { useState } from "react";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@repo/ui/components/select";
import { useModels } from "@/hooks/queries/useModels";
import { ProviderIcon } from "../provider/ProviderIcon";

interface ProviderSwitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProviderId: string;
  hasSession: boolean;
  onConfirm: (providerId: string) => void;
}

export function ProviderSwitchDialog({
  open,
  onOpenChange,
  currentProviderId,
  hasSession,
  onConfirm,
}: ProviderSwitchDialogProps) {
  const { data: providers = [] } = useModels();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const availableProviders = providers.length
    ? providers
    : [{ id: currentProviderId, name: currentProviderId }];

  const targetProvider = selectedProvider ?? currentProviderId;
  const targetName =
    availableProviders.find((item) => item.id === targetProvider)?.name ??
    targetProvider;

  const close = () => {
    setSelectedProvider(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {hasSession
              ? "Continue with another provider?"
              : "Switch provider?"}
          </DialogTitle>
          <DialogDescription>
            {hasSession
              ? "This keeps the current session unchanged and starts a new session with the selected provider."
              : "This chat has no session yet. The selected provider will run it."}
          </DialogDescription>
        </DialogHeader>
        {hasSession && (
          <div className="space-y-2 rounded-md border p-3 text-sm">
            <p className="font-medium">Transferable context</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Conversation summary</li>
              <li>Relevant files and current git diff</li>
              <li>Current task and unresolved questions</li>
            </ul>
          </div>
        )}
        <Select value={targetProvider} onValueChange={setSelectedProvider}>
          <SelectTrigger className="w-full">
            <span className="flex items-center gap-2">
              <ProviderIcon providerId={targetProvider} />
              <span>{targetName}</span>
            </span>
          </SelectTrigger>
          <SelectContent>
            {availableProviders.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                <span className="flex items-center gap-2">
                  <ProviderIcon providerId={item.id} />
                  <span>{item.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={targetProvider === currentProviderId}
            onClick={() => {
              onConfirm(targetProvider);
              setSelectedProvider(null);
            }}
          >
            {hasSession ? "Continue" : "Switch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
