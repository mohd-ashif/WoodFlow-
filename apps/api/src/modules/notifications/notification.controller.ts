import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service.js';

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const userId = req.user?.id;

    const data = await notificationService.getNotifications(companyId, userId);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const { id } = req.params;

    await notificationService.markAsRead(companyId, id);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const userId = req.user?.id;

    await notificationService.markAllAsRead(companyId, userId);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
}
