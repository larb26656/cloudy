import { Cat } from "lucide-react";
import { useEffect, useState } from "react";
import { petBridge } from "@/lib/desktop/petBridge";

/**
 * Desktop-only restore button rendered in the main window while the pet
 * overlay window is hidden. The pet is hidden from its own right-click
 * context menu; clicking this button brings it back.
 */
export function DesktopPetRestore() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let active = true;
    void petBridge.getVisibility().then((visible) => {
      if (active) setHidden(!visible);
    });
    const unsubscribe = petBridge.onVisibility((visible) =>
      setHidden(!visible),
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (!hidden) return null;

  return (
    <button
      type="button"
      aria-label="Show pet"
      onClick={() => petBridge.show()}
      className="fixed right-4 bottom-4 z-30 flex size-9 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Cat data-icon className="size-4" />
    </button>
  );
}
