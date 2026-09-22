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
import { generatePurchaseInvoiceHtml } from './purchase-invoice-pdf.service.js';
import { preparePurchaseWhatsAppShare, resolvePublicShareToken } from './purchase-share.service.js';
import { createAuditLog } from '../audit/audit.service.js';

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

// PDF & PRINT PREVIEW HANDLERS
export async function getPurchasePdfHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const purchaseId = req.params.id;
    const tenantId = req.tenantId!;
    const isDownload = req.query.download === 'true';

    const html = await generatePurchaseInvoiceHtml(tenantId, purchaseId);

    await createAuditLog({
      userId: req.user!.id,
      companyId: tenantId,
      action: isDownload ? 'PURCHASE_INVOICE_DOWNLOADED' : 'PURCHASE_INVOICE_PREVIEWED',
      entity: 'Purchase',
      entityId: purchaseId,
    });

    const disposition = isDownload
      ? `attachment; filename="Purchase-Bill-${purchaseId}.html"`
      : 'inline';

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', disposition);
    return res.send(html);
  } catch (error) {
    next(error);
  }
}

export async function sharePurchaseWhatsAppHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const purchaseId = req.params.id;
    const tenantId = req.tenantId!;
    const userId = req.user!.id;
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const payload = await preparePurchaseWhatsAppShare(tenantId, purchaseId, userId, baseUrl);

    return res.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPublicPurchasePdfHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.params.token;
    const record = resolvePublicShareToken(token);
    const html = await generatePurchaseInvoiceHtml(record.companyId, record.purchaseId);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline');
    return res.send(html);
  } catch (error) {
    next(error);
  }
}
