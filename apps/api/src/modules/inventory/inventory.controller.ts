import { Request, Response, NextFunction } from 'express';
import * as service from './inventory.service.js';
import { stockAdjustmentSchema } from '@furniture-os/shared';
import { BadRequestError } from '../../utils/errors.js';

export async function getInventoryDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const stats = await service.getInventoryDashboard(companyId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

export async function getLowStock(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const result = await service.getLowStock(companyId, page, limit);

    res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOutOfStock(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const result = await service.getOutOfStock(companyId, page, limit);

    res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getStockMovements(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const search = req.query.search as string | undefined;
    const movementType = req.query.movementType as string | undefined;
    const createdBy = req.query.createdBy as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const result = await service.getStockMovements(companyId, {
      search,
      movementType,
      createdBy,
      startDate,
      endDate,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result.movements,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductInventory(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const { productId } = req.params;

    const inventory = await service.getProductInventory(companyId, productId);

    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
}

export async function adjustStock(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const userId = req.user!.id;

    const parsed = stockAdjustmentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.errors[0].message);
    }

    const result = await service.adjustStock(companyId, parsed.data, userId);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Stock updated successfully',
    });
  } catch (error) {
    next(error);
  }
}
