import { Request, Response, NextFunction } from 'express';
import { createAccessRequestSchema } from '@furniture-os/shared';
import * as service from './accessRequest.service.js';

export async function submitRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createAccessRequestSchema.parse(req.body);
    const userId = req.user!.id;
    const request = await service.submitAccessRequest(
      userId,
      input,
      req.ip,
      req.get('user-agent')
    );

    return res.status(201).json({
      success: true,
      message: 'Access request submitted successfully',
      data: { request },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMyRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const requests = await service.getMyAccessRequests(userId);
    return res.status(200).json({
      success: true,
      data: {
        requests,
        request: requests[0] || null,
      },
    });
  } catch (error) {
    return next(error);
  }
}


