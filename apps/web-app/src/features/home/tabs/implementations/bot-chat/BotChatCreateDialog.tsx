import { CreateBotChatDialog } from "@/features/chat/components/CreateBotChatDialog";
import { useTabStore } from "@/stores/tabStore";
import type { CreateDialogProps } from "../../template";

export function BotChatCreateDialog({ open, onOpenChange }: CreateDialogProps) {
  const addTab = useTabStore((s) => s.addTab);

  return (
    <CreateBotChatDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={(data) => addTab("bot-chat", data)}
    />
  );
}
