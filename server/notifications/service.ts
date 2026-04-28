import type { NotificationType } from "@/generated/prisma/enums";
import type { NotificationListResponse } from "@/types/notifications";
import {
  createNotifications,
  listNotificationsForUser,
  listUserIdsByRole,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/server/notifications/notification-repository";
import { NotificationServiceError } from "@/server/notifications/errors";
import { emitNotificationsRefresh } from "@/lib/realtime/socket-server";

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids));
}

export async function getNotifications(
  userId: string,
  limit = 8,
): Promise<NotificationListResponse> {
  const safeLimit = Math.min(Math.max(limit, 1), 20);
  const [items, unreadCount] = await listNotificationsForUser(userId, safeLimit);
  return {
    unreadCount,
    items: items.map((item) => ({
      id: item.id,
      message: item.message,
      type: item.type,
      entityType: item.entityType,
      entityId: item.entityId,
      href: item.href,
      isRead: item.isRead,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  const updated = await markNotificationRead(userId, notificationId);
  if (updated.count === 0) {
    throw new NotificationServiceError("Notification not found.", 404);
  }
}

export async function markNotificationsAsRead(userId: string) {
  await markAllNotificationsRead(userId);
}

export async function notifyUsers(input: {
  userIds: string[];
  message: string;
  type: NotificationType;
  entityType?: string;
  entityId?: string;
  href?: string;
}) {
  await createNotifications({
    ...input,
    userIds: uniqueIds(input.userIds),
  });
  emitNotificationsRefresh();
}

export async function notifyAdmins(input: {
  message: string;
  type: NotificationType;
  entityType?: string;
  entityId?: string;
  href?: string;
  extraUserIds?: string[];
}) {
  const adminUserIds = await listUserIdsByRole("ADMIN");
  await createNotifications({
    ...input,
    userIds: uniqueIds([...(input.extraUserIds ?? []), ...adminUserIds]),
  });
  emitNotificationsRefresh();
}

export async function notifyAdminsBestEffort(input: {
  message: string;
  type: NotificationType;
  entityType?: string;
  entityId?: string;
  href?: string;
  extraUserIds?: string[];
}) {
  try {
    await notifyAdmins(input);
  } catch (error) {
    console.error("Best-effort admin notification failed.", error);
  }
}
