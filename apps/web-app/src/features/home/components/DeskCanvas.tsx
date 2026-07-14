import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";

interface DeskCanvasProps {
  tabId: string;
}

export function DeskCanvas({ tabId }: DeskCanvasProps) {
  return (
    <div className="h-full w-full">
      <Tldraw persistenceKey={`desk-${tabId}`} />
    </div>
  );
}
