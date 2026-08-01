import type { CreateDialogProps } from "../../template";
import { useTabStore } from "@/stores/tabStore";
import { CreateChatDialog } from "@/features/chat/components/CreateChatDialog";

// TODO(future refactor): This wrapper owns `addTab` because the generic
// `CreateDialogProps` (tab) intentionally has no `onSubmit` callback — the tab
// store is a strictly-typed discriminated union (`TabDataMap`), so a generic
// consumer like `MainTabBar` cannot call `addTab(type, data)` without unsafe
// casts (unlike the node side, whose store accepts `Record<string, unknown>`).
// If the tab store typing is ever relaxed, this wrapper can be removed and
// `CreateChatDialog` wired directly into `chatTemplate.CreateDialog`.
export function ChatCreateDialog({ open, onOpenChange }: CreateDialogProps) {
  const addTab = useTabStore((s) => s.addTab);
  return (
    <CreateChatDialog
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={(data) => addTab("chat", data)}
    />
  );
}
