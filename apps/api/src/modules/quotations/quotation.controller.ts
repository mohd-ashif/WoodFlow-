import { Request, Response, NextFunction } from 'express';
import { createQuotationSchema } from '@furniture-os/shared';
import * as quotationService from './quotation.service.js';

export async function createQuotationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    const validated = createQuotationSchema.parse(req.body);
    const qtn = await quotationService.createQuotation(tenantId, validated, userId);
    return res.status(201).json({ success: true, data: qtn });
  } catch (error) {
    next(error);
  }
}

export async function listQuotationsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const customerId = req.query.customerId as string;
    const list = await quotationService.listQuotations(tenantId, customerId);
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

export async function getQuotationByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const qtn = await quotationService.getQuotationById(tenantId, req.params.id);
    return res.status(200).json({ success: true, data: qtn });
  } catch (error) {
    next(error);
  }
}

export async function convertQuotationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    const sale = await quotationService.convertQuotationToSalesOrder(tenantId, req.params.id, userId);
    return res.status(200).json({ success: true, data: sale, message: 'Quotation successfully converted to Sales Order' });
  } catch (error) {
    next(error);
  }
}
