import { createFileRoute } from "@tanstack/react-router";
import { PairDevicePage } from "@/features/settings/components/PairDevicePage";

export const Route = createFileRoute("/pair")({ component: PairDevicePage });
