import { Request, Response, NextFunction } from 'express';
import { getInvoicesList, getInvoiceDetails } from './invoice.service.js';

export async function listInvoicesController(req: Request, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const customerId = req.query.customerId as string;

    const result = await getInvoicesList(req.tenantId!, {
      page,
      limit,
      search,
      status,
      customerId,
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

export async function getInvoiceController(req: Request, res: Response, next: NextFunction) {
  try {
    const invoiceId = req.params.id;
    const invoice = await getInvoiceDetails(req.tenantId!, invoiceId);
    res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
}
