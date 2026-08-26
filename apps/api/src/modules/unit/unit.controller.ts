import { Request, Response, NextFunction } from 'express';
import * as service from './unit.service.js';
import { createUnitSchema, updateUnitSchema } from '@furniture-os/shared';
import { BadRequestError } from '../../utils/errors.js';

export async function getUnits(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const search = req.query.search as string | undefined;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;

    const units = await service.getUnits(companyId, search, isActive);

    res.status(200).json({
      success: true,
      data: { units },
    });
  } catch (error) {
    next(error);
  }
}

export async function createUnit(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const userId = req.user!.id;

    const parsed = createUnitSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.errors[0].message);
    }

    const unit = await service.createUnit(companyId, parsed.data, userId);

    res.status(210).json({
      success: true,
      data: { unit },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUnit(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const userId = req.user!.id;
    const { id } = req.params;

    const parsed = updateUnitSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.errors[0].message);
    }

    const unit = await service.updateUnit(companyId, id, parsed.data, userId);

    res.status(200).json({
      success: true,
      data: { unit },
    });
  } catch (error) {
    next(error);
  }
}

export async function deactivateUnit(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const userId = req.user!.id;
    const { id } = req.params;

    const unit = await service.deactivateUnit(companyId, id, userId);

    res.status(200).json({
      success: true,
      data: { unit },
    });
  } catch (error) {
    next(error);
  }
}
