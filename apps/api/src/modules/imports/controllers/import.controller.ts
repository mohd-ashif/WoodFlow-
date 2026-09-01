import { Request, Response, NextFunction } from 'express';
import { importService } from '../services/import.service.js';
import { BadRequestError } from '../../../utils/errors.js';
import { ImportModuleType } from '../types/import.types.js';

/**
 * POST /api/v1/imports/upload
 * Accept file upload, parse, map, validate, and return draft job preview
 */
export async function uploadAndPreview(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const userId = req.user!.id;
    const { module } = req.body;

    if (!module) {
      throw new BadRequestError('Import module parameter is required (e.g., PRODUCTS, INVENTORY, PURCHASES, SALES, CUSTOMERS, SUPPLIERS, WORKERS).');
    }

    const uploadedFile = (req as any).uploadedFile;
    if (!uploadedFile || !uploadedFile.data) {
      throw new BadRequestError('No file uploaded. Please include an Excel (.xlsx) or CSV (.csv) file.');
    }

    const result = await importService.createAndPreviewJob(
      companyId,
      userId,
      module as ImportModuleType,
      uploadedFile.data,
      uploadedFile.name || 'import-file.csv'
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/imports/confirm
 * Execute the DB transaction for draft import job
 */
export async function confirmImport(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const userId = req.user!.id;
    const { importJobId, duplicateStrategy } = req.body;

    if (!importJobId) {
      throw new BadRequestError('importJobId is required');
    }

    const strategy = duplicateStrategy || 'SKIP';

    const result = await importService.confirmAndExecuteImport(
      companyId,
      userId,
      importJobId,
      strategy,
      []
    );

    res.status(200).json({
      success: true,
      message: 'Import executed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/imports/template/:module
 * Download CSV/Excel import template
 */
export async function downloadTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const { module } = req.params;
    const csvData = importService.getTemplate(module.toUpperCase() as ImportModuleType);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${module.toLowerCase()}_import_template.csv"`);
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/imports/history
 * List past import jobs for company tenant
 */
export async function getImportHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const history = await importService.getImportHistory(companyId);

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/imports/:id
 * Get details of a single import job
 */
export async function getJobDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const { id } = req.params;
    const job = await importService.getJobDetails(companyId, id);

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/imports/:id/errors
 * Download CSV error report for failed/partial import rows
 */
export async function downloadErrorReport(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const { id } = req.params;

    const errorCsv = await importService.generateErrorReportCsv(companyId, id);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="import_errors_${id.slice(-6)}.csv"`);
    res.status(200).send(errorCsv);
  } catch (error) {
    next(error);
  }
}
