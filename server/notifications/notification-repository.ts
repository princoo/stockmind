import type { NotificationType, Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export function listNotificationsForUser(userId: string, limit: number) {
  return Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);
}

export function createNotifications(input: {
  userIds: string[];
  message: string;
  type: NotificationType;
  entityType?: string;
  entityId?: string;
  href?: string;
}) {
  if (!input.userIds.length) return Promise.resolve({ count: 0 });
  return prisma.notification.createMany({
    data: input.userIds.map((userId) => ({
      userId,
      message: input.message,
      type: input.type,
      entityType: input.entityType,
      entityId: input.entityId,
      href: input.href,
    })),
  });
}

export function markNotificationRead(userId: string, notificationId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

export function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export async function listUserIdsByRole(role: Role) {
  const rows = await prisma.user.findMany({
    where: { role },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}
