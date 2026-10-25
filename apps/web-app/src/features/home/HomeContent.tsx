import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Workspace } from "@/lib/cloudy/workspaces";
import { HomeGreeting } from "./components/HomeGreeting";
import { QuickActions } from "./components/QuickActions";
import { RecentSessionsSection } from "./components/RecentSessionsSection";
import { WorkspacesSection } from "./components/WorkspacesSection";
import { WorkspaceDetail } from "./components/WorkspaceDetail";
import { PinnedAgentsSection } from "./components/PinnedAgentsSection";
import { useDeviceType } from "@/hooks/useDeviceType";
import { BoxContainer } from "@/components/layout/BoxContainer";

export function HomeContent({
  onOpenProjectChat,
}: {
  onOpenProjectChat: () => void;
}) {
  // Local UI state for the workspace detail drill-down.
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null,
  );
  const { isDesktop } = useDeviceType();

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
        {isDesktop ? (
          <div className="grid grid-cols-[minmax(0,1fr)_20rem] items-start gap-7">
            <div className="min-w-0">
              <RecentSessionsSection />
            </div>
            <aside className="min-w-0">
              <PinnedAgentsSection />
              <WorkspacesSection
                compact
                onSelectWorkspace={setSelectedWorkspace}
              />
            </aside>
          </div>
        ) : (
          <>
            <PinnedAgentsSection />
            <RecentSessionsSection />
            <WorkspacesSection
              compact
              onSelectWorkspace={setSelectedWorkspace}
            />
          </>
        )}
      </>
    );
  }

  return (
    <div className="h-full overflow-y-auto" ref={scrollRef}>
      <BoxContainer>{content}</BoxContainer>
    </div>
  );
}
