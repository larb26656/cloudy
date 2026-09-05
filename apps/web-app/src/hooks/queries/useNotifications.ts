import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cloudyClient } from "@/lib/api";
import { notificationKeys } from "@/lib/cloudy/query-keys";
import {
  notificationDtoSchema,
  type Notification,
} from "@/lib/cloudy/notifications";

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: async (): Promise<Notification[]> => {
      const res = await cloudyClient.api.notifications.$get();
      if (!res.ok)
        throw new Error(`Failed to list notifications (${res.status})`);
      const data = await res.json();
      return notificationDtoSchema.array().parse(data);
    },
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      type: "info" | "success" | "warning" | "error";
      title: string;
      message: string;
      metadata?: Record<string, string> | null;
    }): Promise<Notification> => {
      const res = await cloudyClient.api.notifications.$post({ json: input });
      if (!res.ok)
        throw new Error(`Failed to create notification (${res.status})`);
      const data = await res.json();
      return notificationDtoSchema.parse(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.root(),
      });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await cloudyClient.api.notifications[":id"].$delete({
        param: { id },
      });
      if ((res.status as number) === 404)
        throw new Error("Notification not found");
      if (!res.ok)
        throw new Error(`Failed to delete notification (${res.status})`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.root(),
      });
    },
  });
}

export function useClearNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const res = await cloudyClient.api.notifications.$delete();
      if (!res.ok)
        throw new Error(`Failed to clear notifications (${res.status})`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.root(),
      });
    },
  });
}
