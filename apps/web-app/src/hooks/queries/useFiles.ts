import { useQuery } from "@tanstack/react-query";
import type { FileContent, FileNode, VcsFileDiff } from "@opencode-ai/sdk/v2";
import {
  fileKeys,
  getErrorMessage,
  getOcClient,
  vcsKeys,
  type SdkError,
} from "@/lib/opencode";

export function useVcsDiff({ directory }: { directory?: string }) {
  return useQuery({
    queryKey: vcsKeys.diff(directory ?? ""),
    queryFn: async (): Promise<VcsFileDiff[]> => {
      if (!directory) return [];
      const oc = getOcClient();
      const result = await oc.vcs.diff({ directory, mode: "git" });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return result.data ?? [];
    },
    enabled: !!directory,
  });
}

export function useFileList({
  directory,
  path,
}: {
  directory?: string;
  path?: string;
}) {
  return useQuery({
    queryKey: fileKeys.list(directory ?? "", path ?? ""),
    queryFn: async (): Promise<FileNode[]> => {
      if (!directory || !path) return [];
      const oc = getOcClient();
      const result = await oc.file.list({ directory, path });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return result.data ?? [];
    },
    enabled: !!directory && !!path,
  });
}

export function useFileRead({
  directory,
  path,
}: {
  directory?: string;
  path?: string;
}) {
  return useQuery({
    queryKey: fileKeys.read(directory ?? "", path ?? ""),
    queryFn: async (): Promise<FileContent> => {
      if (!directory || !path) {
        throw new Error("Directory and path are required");
      }
      const oc = getOcClient();
      const result = await oc.file.read({ directory, path });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      if (!result.data) {
        throw new Error("File could not be read");
      }
      return result.data;
    },
    enabled: !!directory && !!path,
  });
}

export function useFileSearch({
  directory,
  query,
}: {
  directory?: string;
  query: string;
}) {
  return useQuery({
    queryKey: fileKeys.search(directory ?? "", query),
    queryFn: async (): Promise<string[]> => {
      if (!directory || !query.trim()) return [];
      const oc = getOcClient();
      const result = await oc.find.files({ directory, query });
      if (result.error) {
        throw new Error(getErrorMessage(result.error as SdkError));
      }
      return result.data ?? [];
    },
    enabled: !!directory && query.trim().length >= 2,
  });
}
