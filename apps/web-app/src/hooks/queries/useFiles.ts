import { useQuery } from "@tanstack/react-query";
import type { FileContent, FileNode, VcsFileDiff } from "@/types";
import { fileKeys, vcsKeys } from "@/lib/opencode";
import { cloudyClient } from "@/lib/api";

export function useVcsDiff({ directory }: { directory?: string }) {
  return useQuery({
    queryKey: vcsKeys.diff(directory ?? ""),
    queryFn: async (): Promise<VcsFileDiff[]> => {
      if (!directory) return [];
      const response = await cloudyClient.api["agent-providers"][
        ":providerId"
      ].diff.$get({
        param: { providerId: "opencode" },
        query: { directory },
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
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
      const response = await cloudyClient.api["agent-providers"][
        ":providerId"
      ].files.$get({
        param: { providerId: "opencode" },
        query: { directory, path },
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
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
      const response = await cloudyClient.api["agent-providers"][
        ":providerId"
      ].file.$get({
        param: { providerId: "opencode" },
        query: { directory, path },
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
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
      const response = await cloudyClient.api["agent-providers"][":providerId"][
        "file-search"
      ].$get({
        param: { providerId: "opencode" },
        query: { directory, query },
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    enabled: !!directory && query.trim().length >= 2,
  });
}
