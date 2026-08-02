import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cloudyClient } from "@/lib/api";
import { workspaceKeys } from "@/lib/cloudy/query-keys";
import { WorkspacesModel } from "@repo/contracts";
import type { Workspace } from "@/lib/cloudy/workspaces";

export function useWorkspaces() {
  return useQuery({
    queryKey: workspaceKeys.list(),
    queryFn: async (): Promise<Workspace[]> => {
      const res = await cloudyClient.api.workspaces.$get();
      if (!res.ok) throw new Error(`Failed to list workspaces (${res.status})`);
      const data = await res.json();
      return WorkspacesModel.workspaceDtoSchema.array().parse(data);
    },
  });
}

export function useWorkspace(id: string | null) {
  return useQuery({
    queryKey: workspaceKeys.detail(id ?? ""),
    queryFn: async (): Promise<Workspace> => {
      if (!id) throw new Error("Missing workspace id");
      const res =
        await cloudyClient.api.workspaces[":id"].$get({ param: { id } });
      if (!res.ok) throw new Error(`Failed to fetch workspace (${res.status})`);
      const data = await res.json();
      return WorkspacesModel.workspaceDtoSchema.parse(data);
    },
    enabled: !!id,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name: string;
      color: string;
      directory: string;
    }): Promise<Workspace> => {
      const res = await cloudyClient.api.workspaces.$post({ json: input });
      if ((res.status as number) === 409) {
        throw new Error(`Directory "${input.directory}" is already in use`);
      }
      if (!res.ok) {
        throw new Error(`Failed to create workspace (${res.status})`);
      }
      const data = await res.json();
      return WorkspacesModel.workspaceDtoSchema.parse(data);
    },
    onSuccess: (data) => {
      void queryClient.setQueryData(workspaceKeys.list(), (old: unknown) => {
        if (!Array.isArray(old)) return [data];
        return [...old, data];
      });
      void queryClient.prefetchQuery({
        queryKey: workspaceKeys.detail(data.id),
        queryFn: async (): Promise<Workspace> => {
          const res = await cloudyClient.api.workspaces[":id"].$get({
            param: { id: data.id },
          });
          if (!res.ok) throw new Error("prefetch failed");
          const d = await res.json();
          return WorkspacesModel.workspaceDtoSchema.parse(d);
        },
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: {
      id: string;
      name?: string;
      color?: string;
      directory?: string;
    }): Promise<Workspace> => {
      const res = await cloudyClient.api.workspaces[":id"].$patch({
        param: { id },
        json: input,
      });
      if (res.status === 404) throw new Error("Workspace not found");
      if (res.status === 409) {
        throw new Error(`Directory "${input.directory}" is already in use`);
      }
      if (!res.ok) {
        throw new Error(`Failed to update workspace (${res.status})`);
      }
      const data = await res.json();
      return WorkspacesModel.workspaceDtoSchema.parse(data);
    },
    onSuccess: (data) => {
      void queryClient.setQueryData(workspaceKeys.list(), (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.map((w: Workspace) => (w.id === data.id ? data : w));
      });
      void queryClient.setQueryData(workspaceKeys.detail(data.id), data);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await cloudyClient.api.workspaces[":id"].$delete({
        param: { id },
      });
      if ((res.status as number) === 404)
        throw new Error("Workspace not found");
      if (!res.ok) {
        throw new Error(`Failed to delete workspace (${res.status})`);
      }
    },
    onSuccess: (_, id) => {
      void queryClient.setQueryData(workspaceKeys.list(), (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return old.filter((w: Workspace) => w.id !== id);
      });
      void queryClient.removeQueries({ queryKey: workspaceKeys.detail(id) });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
