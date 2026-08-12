import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { useRecentSessions } from "@/hooks/queries";
import { useTabStore } from "@/stores/tabStore";
import type { Workspace } from "@/lib/cloudy/workspaces";
import { HomeGreeting } from "./components/HomeGreeting";
import { RecentDesksSection } from "./components/RecentDesksSection";
import { RecentSessionsSection } from "./components/RecentSessionsSection";
import { OpenTerminalsSection } from "./components/OpenTerminalsSection";
import { WorkspacesSection } from "./components/WorkspacesSection";
import { WorkspaceDetail } from "./components/WorkspaceDetail";

export function HomeContent() {
  // Local UI state for the workspace detail drill-down. Re-reads the same
  // cache key as RecentSessionsSection (React Query dedupes), so the greeting
  // subtitle count stays in sync with the section below.
  const { data: recentSessions = [] } = useRecentSessions({ limit: 8 });
  const tabs = useTabStore((s) => s.tabs);

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

  const desksToday = tabs.filter(
    (t) => t.type === "desk" && Date.now() - t.updatedAt < 24 * 60 * 60 * 1000,
  ).length;

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
        <HomeGreeting
          desksToday={desksToday}
          recentSessions={recentSessions.length}
        />
        <RecentDesksSection />
        <OpenTerminalsSection />
        <RecentSessionsSection />
        <WorkspacesSection onSelectWorkspace={setSelectedWorkspace} />
      </>
    );
  }

  return (
    <div className="h-full overflow-y-auto" ref={scrollRef}>
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="mb-4 flex justify-end">
          <Link
            to="/settings"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings size={16} />
          </Link>
        </div>
        {content}
      </div>
    </div>
  );
}
