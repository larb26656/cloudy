import { useTabStore } from "@/stores/tabStore";
import { DeskCard } from "./DeskCard";

export function RecentDesksSection() {
  const tabs = useTabStore((s) => s.tabs);
  const setActiveTab = useTabStore((s) => s.setActiveTab);

  const desks = tabs
    .filter((t) => t.type === "desk")
    .sort((a, b) => b.updatedAt - a.updatedAt);

  if (desks.length === 0) return null;

  return (
    <section className="mb-9">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="text-sm font-bold">Recent</h2>
      </div>
      <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-1 scrollbar-none">
        {desks.map((tab) => (
          <DeskCard
            key={tab.id}
            tab={tab}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>
    </section>
  );
}
