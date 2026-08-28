import { Request, Response, NextFunction } from 'express';
import { recordCRMActivity, getCRMActivities } from './activity.service.js';
import { createActivitySchema } from '@furniture-os/shared';

export async function listActivities(req: Request, res: Response, next: NextFunction) {
  try {
    const entityType = req.query.entityType as any;
    const entityId = req.query.entityId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await getCRMActivities(req.tenantId!, {
      entityType,
      entityId,
      page,
      limit,
    });

    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function createActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createActivitySchema.parse(req.body);
    const activity = await recordCRMActivity({
      companyId: req.tenantId!,
      entityType: body.entityType,
      entityId: body.entityId,
      activityType: body.activityType,
      title: body.title,
      description: body.description,
      createdBy: req.user?.id,
    });

    res.status(201).json({
      success: true,
      data: activity,
      message: 'CRM activity recorded',
    });
  } catch (error) {
    next(error);
  }
}
