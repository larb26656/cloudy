import { Terminal } from "lucide-react";
import { useState } from "react";
import type { TabTemplate, TabTitleProps } from "../../template";
import { usePtySession } from "@/hooks/queries";
import { cloudyClient } from "@/lib/api";
import { TerminalNameInput } from "@/components/terminal";
import { TerminalCreateDialog } from "./TerminalCreateDialog";
import { TerminalContent } from "./TerminalContent";

export type TerminalData = {
  directory: string;
  ptyId: string | null;
};

function TerminalTabTitle({ data }: TabTitleProps<TerminalData>) {
  const { data: session } = usePtySession(data.ptyId);
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing && data.ptyId) {
    return (
      <TerminalNameInput
        sessionId={data.ptyId}
        initialName={session?.name ?? "Terminal"}
        onDone={() => setIsEditing(false)}
      />
    );
  }

  return (
    <span
      className="truncate"
      onDoubleClick={
        data.ptyId
          ? (event) => {
              event.stopPropagation();
              setIsEditing(true);
            }
          : undefined
      }
    >
      {session?.name ?? "Terminal"}
    </span>
  );
}

export const terminalTemplate: TabTemplate<TerminalData> = {
  type: "terminal",
  label: "New Terminal",
  icon: Terminal,
  TitleComponent: TerminalTabTitle,
  ContentComponent: TerminalContent,
  CreateDialog: TerminalCreateDialog,
  onClose: (tab) => {
    if (tab.type !== "terminal") return;
    const ptyId = tab.data.ptyId;
    if (ptyId) {
      void cloudyClient.api.pty.sessions[":id"]
        .$delete({ param: { id: ptyId } })
        .catch(() => {});
    }
  },
};
