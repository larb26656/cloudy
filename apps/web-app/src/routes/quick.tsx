import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { QuickCloudy } from "@/features/quick-cloudy/QuickCloudy";

function QuickRoute() {
  useEffect(() => {
    document.documentElement.setAttribute("data-quick-window", "true");
    return () => document.documentElement.removeAttribute("data-quick-window");
  }, []);

  return <QuickCloudy />;
}

export const Route = createFileRoute("/quick")({ component: QuickRoute });
