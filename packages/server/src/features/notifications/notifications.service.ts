import { randomUUID } from "node:crypto";
import type {
  CreateNotificationInput,
  NotificationDto,
} from "./notifications.model";
import type { NotificationsRepository } from "./notifications.repository";
import { NotificationNotFoundError } from "./notifications.errors";

/** Maximum retained notifications; older rows are pruned on every create. */
export const NOTIFICATION_LIMIT = 30;

export type NotificationCreatedListener = (
  notification: NotificationDto,
) => void;
export type NotificationDeletedListener = (id: string) => void;
export type NotificationsClearedListener = () => void;

/**
 * Notifications business logic. Framework-free — throws
 * `NotificationNotFoundError` (a `DomainError` subclass) on missing ids; the
 * HTTP edge maps that to 404. Sync throughout — no Promises. Every mutation
 * emits on the listener sets (`onCreated`/`onDeleted`/`onCleared`) so the
 * WebSocket adapter can push frames without polling.
 */
export function createNotificationsService(repo: NotificationsRepository) {
  const createdListeners = new Set<NotificationCreatedListener>();
  const deletedListeners = new Set<NotificationDeletedListener>();
  const clearedListeners = new Set<NotificationsClearedListener>();

  const emitCreated = (notification: NotificationDto) => {
    for (const listener of createdListeners) listener(notification);
  };
  const emitDeleted = (id: string) => {
    for (const listener of deletedListeners) listener(id);
  };
  const emitCleared = () => {
    for (const listener of clearedListeners) listener();
  };

  const list = (): NotificationDto[] => repo.list();

  const create = (input: CreateNotificationInput): NotificationDto => {
    const notification = repo.create({ ...input, id: randomUUID() });
    emitCreated(notification);
    for (const id of repo.pruneToLimit(NOTIFICATION_LIMIT)) emitDeleted(id);
    return notification;
  };

  const remove = (id: string): void => {
    if (!repo.delete(id)) throw new NotificationNotFoundError(id);
    emitDeleted(id);
  };

  const clear = (): void => {
    repo.deleteAll();
    emitCleared();
  };

  const onCreated = (listener: NotificationCreatedListener): (() => void) => {
    createdListeners.add(listener);
    return () => createdListeners.delete(listener);
  };

  const onDeleted = (listener: NotificationDeletedListener): (() => void) => {
    deletedListeners.add(listener);
    return () => deletedListeners.delete(listener);
  };

  const onCleared = (listener: NotificationsClearedListener): (() => void) => {
    clearedListeners.add(listener);
    return () => clearedListeners.delete(listener);
  };

  return {
    list,
    create,
    delete: remove,
    clear,
    onCreated,
    onDeleted,
    onCleared,
  };
}

export type NotificationsService = ReturnType<
  typeof createNotificationsService
>;
