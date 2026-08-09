import { FolderOpen } from "lucide-react";
import type { NodeTemplate } from "../../template";
import { FilesNode } from "./FilesNode";
import { FilesNodeCreateDialog } from "./FilesNodeCreateDialog";

export const filesNodeTemplate: NodeTemplate = {
  id: "files-node",
  label: "Files",
  icon: FolderOpen,
  size: { width: 1024, height: 768 },
  configDialog: FilesNodeCreateDialog,
  component: FilesNode,
};
