import { FileDiff } from "lucide-react";
import type { TabTemplate } from "../../template";
import { FilesContent } from "./FilesContent";
import { FilesTabItem } from "./FilesTabItem";

export type FilesData = Record<string, never>;

export const filesTemplate: TabTemplate<FilesData> = {
  type: "files",
  label: "Changed Files",
  icon: FileDiff,
  TabBarComponent: FilesTabItem,
  ContentComponent: FilesContent,
  defaultData: {},
};
