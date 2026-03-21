import ChatPage from "@/features/chat/ChatPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_appMainLayout/")({
  component: ChatPage,
});
