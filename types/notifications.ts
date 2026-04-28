import type { NotificationType } from "@/generated/prisma/enums";

export type AppNotification = {
  id: string;
  message: string;
  type: NotificationType;
  entityType: string | null;
  entityId: string | null;
  href: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationListResponse = {
  unreadCount: number;
  items: AppNotification[];
};
