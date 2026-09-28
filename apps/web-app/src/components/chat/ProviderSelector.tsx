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

interface ProviderSelectorProps {
  providerId: string;
  sessionId: string | null;
  onContinue: (providerId: string) => void;
}

export function ProviderSelector({
  providerId,
  sessionId,
  onContinue,
}: ProviderSelectorProps) {
  const { data: providers = [] } = useModels();
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);
  const availableProviders = providers.length
    ? providers
    : [{ id: providerId, name: providerId }];

  return (
    <>
      <Select
        value={providerId}
        onValueChange={(value) => {
          if (!value || value === providerId) return;
          if (!sessionId) {
            onContinue(value);
            return;
          }
          setPendingProvider(value);
        }}
      >
        <SelectTrigger className="h-8 w-auto gap-1 border-0 px-2 text-xs shadow-none">
          <ProviderIcon providerId={providerId} />
        </SelectTrigger>
        <SelectContent>
          {availableProviders.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              <div className="flex items-center gap-2">
                <ProviderIcon providerId={item.id} />
                <span>{item.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Dialog
        open={pendingProvider !== null}
        onOpenChange={(open) => !open && setPendingProvider(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Continue with another provider?</DialogTitle>
            <DialogDescription>
              This keeps the current session unchanged and starts a new session
              with the selected provider.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-md border p-3 text-sm">
            <p className="font-medium">Transferable context</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Conversation summary</li>
              <li>Relevant files and current git diff</li>
              <li>Current task and unresolved questions</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingProvider(null)}>
              Cancel
            </Button>
            <Button
              disabled={!pendingProvider || !sessionId}
              onClick={() => {
                if (pendingProvider) onContinue(pendingProvider);
                setPendingProvider(null);
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
