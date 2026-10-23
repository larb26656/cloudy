import { useEffect, useState } from "react";
import { Cat } from "lucide-react";
import { Switch } from "@repo/ui/components/switch";
import { isModeElectron } from "@/config/env";
import { petBridge } from "@/lib/desktop/petBridge";
import { usePetVisibilityStore } from "@/stores/petVisibilityStore";

export function PetSettings() {
  const visible = usePetVisibilityStore((state) => state.visible);
  const setVisible = usePetVisibilityStore((state) => state.setVisible);
  const [desktopVisible, setDesktopVisible] = useState(true);

  useEffect(() => {
    if (!isModeElectron) return undefined;

    let active = true;
    void petBridge.getVisibility().then((isVisible) => {
      if (active) setDesktopVisible(isVisible);
    });
    const unsubscribe = petBridge.onVisibility(setDesktopVisible);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const isVisible = isModeElectron ? desktopVisible : visible;

  const handleToggle = (checked: boolean) => {
    if (isModeElectron) {
      setDesktopVisible(checked);
      if (checked) petBridge.show();
      else petBridge.hide();
      return;
    }
    setVisible(checked);
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
          <Cat className="size-4" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Show Pet</p>
          <p className="text-xs text-muted-foreground">
            Show or hide the floating pet.
          </p>
        </div>
      </div>
      <Switch
        checked={isVisible}
        onCheckedChange={handleToggle}
        aria-label="Show pet"
      />
    </div>
  );
}
