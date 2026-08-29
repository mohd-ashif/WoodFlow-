import { Request, Response, NextFunction } from 'express';
import { createPurchaseSchema, cancelPurchaseSchema, purchaseQuerySchema } from '@furniture-os/shared';
import {
  createPurchaseDraft,
  confirmPurchase,
  cancelPurchase,
  getPurchasesList,
  getPurchaseDetails,
  getPurchasesOverview,
} from './purchase.service.js';

export async function createPurchase(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createPurchaseSchema.parse(req.body);
    const purchase = await createPurchaseDraft(req.tenantId!, input, req.user!.id);
    res.status(201).json({
      success: true,
      data: purchase,
      message: 'Purchase draft created successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function confirmPurchaseController(req: Request, res: Response, next: NextFunction) {
  try {
    const purchaseId = req.params.id;
    const purchase = await confirmPurchase(req.tenantId!, purchaseId, req.user!.id);
    res.json({
      success: true,
      data: purchase,
      message: 'Purchase confirmed and Stock IN recorded successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelPurchaseController(req: Request, res: Response, next: NextFunction) {
  try {
    const purchaseId = req.params.id;
    const body = cancelPurchaseSchema.parse(req.body);
    const purchase = await cancelPurchase(req.tenantId!, purchaseId, body.reason, req.user!.id);
    res.json({
      success: true,
      data: purchase,
      message: 'Purchase cancelled and stock reversed successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function listPurchasesController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = purchaseQuerySchema.parse({
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      status: req.query.status as string,
      paymentStatus: req.query.paymentStatus as string,
      supplierId: req.query.supplierId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });

    const result = await getPurchasesList(req.tenantId!, query);
    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPurchaseController(req: Request, res: Response, next: NextFunction) {
  try {
    const purchaseId = req.params.id;
    const purchase = await getPurchaseDetails(req.tenantId!, purchaseId);
    res.json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPurchasesOverviewController(req: Request, res: Response, next: NextFunction) {
  try {
    const overview = await getPurchasesOverview(req.tenantId!);
    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    next(error);
  }
}
