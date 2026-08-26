import { Request, Response, NextFunction } from 'express';
import * as service from './product.service.js';
import { createProductSchema, updateProductSchema } from '@furniture-os/shared';
import { BadRequestError } from '../../utils/errors.js';

export async function getProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const search = req.query.search as string | undefined;
    const filterType = req.query.filterType as any;
    const categoryId = req.query.categoryId as string | undefined;
    const sortBy = req.query.sortBy as any;
    const sortOrder = req.query.sortOrder as any;
    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    const result = await service.getProducts(companyId, {
      search,
      filterType,
      categoryId,
      sortBy,
      sortOrder,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const userId = req.user!.id;

    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.errors[0].message);
    }

    const product = await service.createProduct(companyId, parsed.data, userId);

    res.status(210).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductById(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const { id } = req.params;

    const result = await service.getProductById(companyId, id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const userId = req.user!.id;
    const { id } = req.params;

    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.errors[0].message);
    }

    const product = await service.updateProduct(companyId, id, parsed.data, userId);

    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

export async function deactivateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const userId = req.user!.id;
    const { id } = req.params;

    const product = await service.deactivateProduct(companyId, id, userId);

    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}

export async function activateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const userId = req.user!.id;
    const { id } = req.params;

    const product = await service.activateProduct(companyId, id, userId);

    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
}
