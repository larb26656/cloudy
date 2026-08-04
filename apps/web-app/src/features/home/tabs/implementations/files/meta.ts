import { FileDiff } from "lucide-react";
import type { TabTemplate } from "../../template";
import { FilesCreateDialog } from "./FilesCreateDialog";
import { FilesContent } from "./FilesContent";
import { FilesTabItem } from "./FilesTabItem";

export type FilesData = {
  /** Null when the tab is ephemeral (opened with no registered workspace). */
  workspaceId: string | null;
  /** Filesystem path used for all opencode calls. Always present. */
  directory: string;
};

export const filesTemplate: TabTemplate<FilesData> = {
  type: "files",
  label: "Changed Files",
  icon: FileDiff,
  TabBarComponent: FilesTabItem,
  ContentComponent: FilesContent,
  CreateDialog: FilesCreateDialog,
};
