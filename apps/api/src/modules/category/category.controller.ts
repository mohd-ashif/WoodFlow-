import { Request, Response, NextFunction } from 'express';
import * as service from './category.service.js';
import { createCategorySchema, updateCategorySchema } from '@furniture-os/shared';
import { BadRequestError } from '../../utils/errors.js';

export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const search = req.query.search as string | undefined;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;

    const categories = await service.getCategories(companyId, search, isActive);

    res.status(200).json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const userId = req.user!.id;

    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.errors[0].message);
    }

    const category = await service.createCategory(companyId, parsed.data, userId);

    res.status(210).json({
      success: true,
      data: { category },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const userId = req.user!.id;
    const { id } = req.params;

    const parsed = updateCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.errors[0].message);
    }

    const category = await service.updateCategory(companyId, id, parsed.data, userId);

    res.status(200).json({
      success: true,
      data: { category },
    });
  } catch (error) {
    next(error);
  }
}

export async function deactivateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const userId = req.user!.id;
    const { id } = req.params;

    const category = await service.deactivateCategory(companyId, id, userId);

    res.status(200).json({
      success: true,
      data: { category },
    });
  } catch (error) {
    next(error);
  }
}
