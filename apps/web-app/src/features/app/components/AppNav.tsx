import { FolderKanban, Home } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { useHomeSectionStore } from "@/stores/homeSectionStore";
import { useTabStore } from "@/stores/tabStore";
import type { AppPage } from "@/features/home/pages";

const navItems = [
  { section: "home", label: "Home", icon: Home },
  { section: "workspaces", label: "Workspaces", icon: FolderKanban },
] as const;

export function AppNav({
  className,
  onNavigate,
  compact = false,
}: {
  className?: string;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const activeSection = useHomeSectionStore((s) => s.activeSection);
  const setActiveSection = useHomeSectionStore((s) => s.setActiveSection);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const setActiveTab = useTabStore((s) => s.setActiveTab);

  const handleSelect = (section: "home" | AppPage) => {
    setActiveSection(section);
    setActiveTab("home");
    onNavigate?.();
  };

  return (
    <nav className={cn("flex flex-col gap-1 p-2", className)} aria-label="Main">
      {navItems.map(({ section, label, icon: Icon }) => {
        return (
          <button
            key={section}
            type="button"
            onClick={() => handleSelect(section)}
            title={label}
            aria-label={label}
            className={cn(
              "inline-flex h-10 shrink-0 items-center rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors outline-none select-none whitespace-nowrap hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
              compact ? "justify-center lg:justify-start lg:gap-2" : "gap-2",
              activeTabId === "home" &&
                activeSection === section &&
                "bg-muted text-foreground",
            )}
          >
            <Icon data-icon className="size-4" />
            <span className={compact ? "hidden lg:inline" : undefined}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
