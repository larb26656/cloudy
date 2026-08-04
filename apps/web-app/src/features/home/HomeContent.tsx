import { useState } from "react";
import { useRecentSessions } from "@/hooks/queries";
import { useTabStore } from "@/stores/tabStore";
import type { Workspace } from "@/lib/cloudy/workspaces";
import { HomeGreeting } from "./components/HomeGreeting";
import { RecentDesksSection } from "./components/RecentDesksSection";
import { RecentSessionsSection } from "./components/RecentSessionsSection";
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

  const desksToday = tabs.filter(
    (t) => t.type === "desk" && Date.now() - t.updatedAt < 24 * 60 * 60 * 1000,
  ).length;

  if (selectedWorkspace) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <WorkspaceDetail
          workspace={selectedWorkspace}
          onBack={() => setSelectedWorkspace(null)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <HomeGreeting
        desksToday={desksToday}
        recentSessions={recentSessions.length}
      />
      <RecentDesksSection />
      <RecentSessionsSection />
      <WorkspacesSection onSelectWorkspace={setSelectedWorkspace} />
    </div>
  );
}
