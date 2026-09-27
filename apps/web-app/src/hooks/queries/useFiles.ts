import { useQuery } from "@tanstack/react-query";
import type { FileContent, FileNode, VcsFileDiff } from "@/types";
import { fileKeys, vcsKeys } from "@/lib/opencode";
import { providerApi } from "@/lib/cloudy/provider";

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

export function useVcsDiff({ directory }: { directory?: string }) {
  return useQuery({
    queryKey: vcsKeys.diff(directory ?? ""),
    queryFn: async (): Promise<VcsFileDiff[]> => {
      if (!directory) return [];
      return json<VcsFileDiff[]>(await providerApi.diff(directory));
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
      return json<FileNode[]>(await providerApi.files(directory, path));
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
      return json<FileContent>(await providerApi.readFile(directory, path));
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
      return json<string[]>(await providerApi.searchFiles(directory, query));
    },
    enabled: !!directory && query.trim().length >= 2,
  });
}
