import { prisma } from '../../config/prisma.js';

export class NotificationService {
  /**
   * List notifications for company tenant and optionally specific user
   */
  public async getNotifications(companyId: string, userId?: string, limit = 20) {
    let notifications: any[] = [];
    try {
      notifications = await (prisma as any).notification.findMany({
        where: {
          companyId,
          OR: [
            { userId: null },
            { userId: userId || undefined }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    } catch {
      notifications = [];
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
      notifications,
      unreadCount
    };
  }

  /**
   * Mark a single notification as read
   */
  public async markAsRead(companyId: string, notificationId: string) {
    try {
      return await (prisma as any).notification.updateMany({
        where: { id: notificationId, companyId },
        data: { isRead: true }
      });
    } catch {
      return { count: 0 };
    }
  }

  /**
   * Mark all notifications as read for tenant
   */
  public async markAllAsRead(companyId: string, userId?: string) {
    try {
      return await (prisma as any).notification.updateMany({
        where: {
          companyId,
          OR: [
            { userId: null },
            { userId: userId || undefined }
          ]
        },
        data: { isRead: true }
      });
    } catch {
      return { count: 0 };
    }
  }

  /**
   * System helper: Create in-app notification
   */
  public async createNotification(data: {
    companyId: string;
    userId?: string;
    title: string;
    message: string;
    type?: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'PAYMENT_DUE' | 'PURCHASE_DUE' | 'IMPORT_COMPLETED' | 'INVOICE_CREATED' | 'STOCK_ADJUSTMENT' | 'SYSTEM';
    link?: string;
  }) {
    try {
      return await (prisma as any).notification.create({
        data: {
          companyId: data.companyId,
          userId: data.userId || null,
          title: data.title,
          message: data.message,
          type: data.type || 'SYSTEM',
          link: data.link || null
        }
      });
    } catch {
      return null;
    }
  }
}

export const notificationService = new NotificationService();
