import { Link, useLocation } from "@tanstack/react-router";
import { Lightbulb, Brain, MessageCircle, FileCode, Settings } from "lucide-react";

const navItems = [
  { to: "/", label: "Chat", icon: MessageCircle },
  { to: "/ideas", label: "Idea", icon: Lightbulb },
  { to: "/memory", label: "Memory", icon: Brain },
  { to: "/artifact", label: "Artifact", icon: FileCode },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const location = useLocation();

  return (
    <div className="flex flex-col gap-1 p-2">
      {navItems.map(({ to, label, icon: Icon }) => {
        const isActive = location.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={`inline-flex shrink-0 items-center justify-start gap-2 h-10 rounded-[min(var(--radius-md),12px)] px-2.5 text-sm font-medium transition-all outline-none select-none whitespace-nowrap focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
