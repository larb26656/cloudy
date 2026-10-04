import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Workspace } from "@/lib/cloudy/workspaces";
import { HomeGreeting } from "./components/HomeGreeting";
import { QuickActions } from "./components/QuickActions";
import { RecentSessionsSection } from "./components/RecentSessionsSection";
import { WorkspacesSection } from "./components/WorkspacesSection";
import { WorkspaceDetail } from "./components/WorkspaceDetail";

export function HomeContent({
  onOpenProjectChat,
}: {
  onOpenProjectChat: () => void;
}) {
  // Local UI state for the workspace detail drill-down.
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null,
  );

  // The scroll container lives here so the component that owns the
  // selectedWorkspace state also owns the scroll position. On open we save
  // the current offset and jump to top; on Back we restore it.
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedScrollRef = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (selectedWorkspace) {
      savedScrollRef.current = el.scrollTop;
      el.scrollTo({ top: 0 });
    } else {
      el.scrollTo({ top: savedScrollRef.current });
    }
  }, [selectedWorkspace]);

  let content: ReactNode;
  if (selectedWorkspace) {
    content = (
      <WorkspaceDetail
        workspace={selectedWorkspace}
        onBack={() => setSelectedWorkspace(null)}
      />
    );
  } else {
    content = (
      <>
        <HomeGreeting />
        <QuickActions onOpenProjectChat={onOpenProjectChat} />
        <RecentSessionsSection />
        <WorkspacesSection onSelectWorkspace={setSelectedWorkspace} />
      </>
    );
  }

  return (
    <div className="h-full overflow-y-auto" ref={scrollRef}>
      <div className="mx-auto w-full max-w-4xl px-6 py-10">{content}</div>
    </div>
  );
}
