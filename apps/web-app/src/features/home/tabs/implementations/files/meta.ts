import { FileDiff } from "lucide-react";
import type { TabTemplate } from "../../template";
import { FilesCreateDialog } from "./FilesCreateDialog";
import { FilesContent } from "./FilesContent";

export type FilesData = {
  /** Null when the tab is ephemeral (opened with no registered workspace). */
  workspaceId: string | null;
  /** Filesystem path used for all opencode calls. Always present. */
  directory: string;
};

function FilesTabTitle() {
  return "Changed Files";
}

export const filesTemplate: TabTemplate<FilesData> = {
  type: "files",
  label: "Changed Files",
  icon: FileDiff,
  TitleComponent: FilesTabTitle,
  ContentComponent: FilesContent,
  CreateDialog: FilesCreateDialog,
  getWorkspaceId: (data) => data.workspaceId,
};
