import { Request, Response, NextFunction } from 'express';
import * as traceabilityService from './traceability.service.js';

export async function getDocumentTimelineHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const { entityType, entityId } = req.params;
    const timeline = await traceabilityService.getDocumentTimeline(tenantId, entityType, entityId);
    return res.status(200).json({ success: true, data: timeline });
  } catch (error) {
    next(error);
  }
}
