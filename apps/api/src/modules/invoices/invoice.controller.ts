import { Request, Response, NextFunction } from 'express';
import { getInvoicesList, getInvoiceDetails, exportInvoices } from './invoice.service.js';

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

export async function exportInvoicesController(req: Request, res: Response, next: NextFunction) {
  try {
    const search = req.query.search as string;
    const status = req.query.status as string;
    const customerId = req.query.customerId as string;
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;
    const format = (req.query.format as string) || 'csv';

    const csvContent = await exportInvoices(req.tenantId!, {
      search,
      status,
      customerId,
      fromDate,
      toDate,
      format,
    });

    const fileExt = format === 'excel' ? 'csv' : 'csv';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="invoices_export_${new Date().toISOString().split('T')[0]}.${fileExt}"`
    );
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
}

