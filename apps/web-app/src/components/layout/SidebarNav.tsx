import { Link, useLocation } from "@tanstack/react-router";
import { Lightbulb, Brain, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", label: "Chat", icon: MessageCircle },
  { to: "/idea", label: "Idea", icon: Lightbulb },
  { to: "/memory", label: "Memory", icon: Brain },
];

export function SidebarNav() {
  const location = useLocation();

  return (
    <div className="flex flex-col gap-1 p-2">
      {navItems.map(({ to, label, icon: Icon }) => {
        const isActive = location.pathname === to;
        return (
          <Button
            key={to}
            variant={isActive ? "default" : "ghost"}
            className="justify-start gap-2"
            size={"lg"}
            asChild
          >
            <Link to={to}>
              <Icon className="size-4" />
              {label}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
