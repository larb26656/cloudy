export interface FileNode {
  name: string;
  path: string;
  absolute: string;
  type: "file" | "directory";
  ignored?: boolean;
}

export interface FileContent {
  type: "text" | "binary";
  content?: string;
}

export interface VcsFileDiff {
  file: string;
  additions: number;
  deletions: number;
  status?: string;
  patch?: string;
}
