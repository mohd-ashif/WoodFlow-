import { prisma } from '../../../config/prisma.js';
import { BadRequestError, NotFoundError } from '../../../utils/errors.js';
import { ImportModuleType, DuplicateStrategy, ImportPreviewResponse } from '../types/import.types.js';
import { fileParserService } from './file-parser.service.js';
import { validationService } from './validation.service.js';
import { duplicateService } from './duplicate.service.js';
import { importTransactionService } from './import-transaction.service.js';
import { importTemplateService } from '../templates/import-template.service.js';

export class ImportService {
  /**
   * Process uploaded file buffer, map columns, validate rows, detect duplicates, and save draft ImportJob
   */
  public async createAndPreviewJob(
    companyId: string,
    userId: string,
    module: ImportModuleType,
    fileBuffer: Buffer,
    fileName: string
  ): Promise<{ importJobId: string; preview: ImportPreviewResponse }> {
    // Parse file
    const parsed = fileParserService.parseFile(fileBuffer, fileName);

    // Auto-suggest column mappings
    const mappings = validationService.suggestMappings(module, parsed.headers);

    // Validate rows
    const { validRows, errors } = validationService.validateRows(module, parsed.rows, mappings);

    // Detect duplicates on valid rows
    const duplicates = await duplicateService.checkDuplicates(companyId, module, validRows);

    const validRowsCount = validRows.length;
    const invalidRowsCount = errors.length;
    const duplicateRowsCount = duplicates.length;

    // Create ImportJob DB record
    const job = await (prisma as any).importJob.create({
      data: {
        companyId,
        userId,
        module: module as any,
        fileName,
        fileType: parsed.fileType,
        totalRows: parsed.totalRows,
        successfulRows: 0,
        failedRows: invalidRowsCount,
        duplicateRows: duplicateRowsCount,
        status: 'READY',
        errors: {
          mappings,
          errors,
          duplicates,
          validRows
        }
      }
    });

    const previewSample = parsed.rows.slice(0, 5);

    return {
      importJobId: job.id,
      preview: {
        totalRows: parsed.totalRows,
        validRowsCount,
        invalidRowsCount,
        duplicateRowsCount,
        mappings,
        errors,
        duplicates,
        previewSample
      }
    };
  }

  /**
   * Confirm & Execute Import Job
   */
  public async confirmAndExecuteImport(
    companyId: string,
    userId: string,
    importJobId: string,
    duplicateStrategy: DuplicateStrategy,
    userPermissions: string[] = []
  ) {
    const job = await (prisma as any).importJob.findUnique({
      where: { id: importJobId }
    });

    if (!job || job.companyId !== companyId) {
      throw new NotFoundError('Import job not found or unauthorized');
    }

    if (job.status === 'IMPORTING' || job.status === 'COMPLETED') {
      throw new BadRequestError(`Import job has already been processed (status: ${job.status}).`);
    }

    const payload = job.errors as any;
    if (!payload || !payload.validRows) {
      throw new BadRequestError('Import job does not contain valid data rows to process.');
    }

    // Update status to IMPORTING
    await (prisma as any).importJob.update({
      where: { id: job.id },
      data: { status: 'IMPORTING', startedAt: new Date() }
    });

    const { validRows, errors: validationErrors } = payload;

    // Execute transactional import
    const { successfulCount, failedCount, errors: execErrors } = await importTransactionService.executeImportTransaction(
      companyId,
      userId,
      job.module as ImportModuleType,
      validRows,
      duplicateStrategy,
      userPermissions
    );

    const totalFailed = validationErrors.length + failedCount;
    const finalStatus =
      successfulCount === 0 && totalFailed > 0
        ? 'FAILED'
        : totalFailed > 0
        ? 'PARTIAL'
        : 'COMPLETED';

    const allErrors = [...validationErrors, ...execErrors];

    const updatedJob = await (prisma as any).importJob.update({
      where: { id: job.id },
      data: {
        successfulRows: successfulCount,
        failedRows: totalFailed,
        status: finalStatus as any,
        completedAt: new Date(),
        errors: {
          ...payload,
          finalErrors: allErrors
        }
      }
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId,
        companyId,
        action: 'IMPORT_DATA',
        entity: 'ImportJob',
        entityId: job.id,
        metadata: {
          module: job.module,
          fileName: job.fileName,
          totalRows: job.totalRows,
          successfulRows: successfulCount,
          failedRows: totalFailed,
          duplicateStrategy
        }
      }
    });

    return {
      importJobId: updatedJob.id,
      status: finalStatus,
      totalRows: job.totalRows,
      successfulRows: successfulCount,
      failedRows: totalFailed,
      completedAt: updatedJob.completedAt
    };
  }

  /**
   * Generate downloadable CSV Error Report for an import job
   */
  public async generateErrorReportCsv(companyId: string, importJobId: string): Promise<string> {
    const job = await (prisma as any).importJob.findUnique({
      where: { id: importJobId }
    });

    if (!job || job.companyId !== companyId) {
      throw new NotFoundError('Import job not found');
    }

    const payload = job.errors as any;
    const errorsList = payload?.finalErrors || payload?.errors || [];

    let csvContent = `"Row Number","Field","Error Message","Value"\n`;

    errorsList.forEach((err: any) => {
      const row = err.row || err.rowNum || 'N/A';
      const field = err.field || 'General';
      const msg = (err.message || err.error || '').replace(/"/g, '""');
      const val = (err.value !== undefined ? String(err.value) : '').replace(/"/g, '""');

      csvContent += `"${row}","${field}","${msg}","${val}"\n`;
    });

    return csvContent;
  }

  /**
   * List import history for company tenant
   */
  public async getImportHistory(companyId: string, limit = 50) {
    const jobs = await (prisma as any).importJob.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    return jobs.map((j: any) => ({
      id: j.id,
      module: j.module,
      fileName: j.fileName,
      fileType: j.fileType,
      totalRows: j.totalRows,
      successfulRows: j.successfulRows,
      failedRows: j.failedRows,
      duplicateRows: j.duplicateRows,
      status: j.status,
      createdAt: j.createdAt,
      completedAt: j.completedAt,
      importedBy: j.user ? j.user.name : 'Unknown User'
    }));
  }

  /**
   * Get single job details
   */
  public async getJobDetails(companyId: string, importJobId: string) {
    const job = await (prisma as any).importJob.findUnique({
      where: { id: importJobId },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    if (!job || job.companyId !== companyId) {
      throw new NotFoundError('Import job not found');
    }

    return job;
  }

  /**
   * Download template for module
   */
  public getTemplate(module: ImportModuleType): string {
    return importTemplateService.generateCsvTemplate(module);
  }
}

export const importService = new ImportService();
