import { createFileRoute } from "@tanstack/react-router";
import { QuickCloudy } from "@/components/quick-cloudy/QuickCloudy";

export const Route = createFileRoute("/quick")({ component: QuickCloudy });
