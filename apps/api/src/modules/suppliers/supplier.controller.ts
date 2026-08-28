import { Request, Response, NextFunction } from 'express';
import * as supplierService from './supplier.service.js';
import * as supplierRepo from './supplier.repository.js';
import { getCRMActivities } from '../crm/activity.service.js';
import {
  createSupplierSchema,
  updateSupplierSchema,
  supplierAddressSchema,
  createNoteSchema,
  checkSupplierDuplicateSchema,
} from '@furniture-os/shared';
import { hasPermission } from '../../middleware/rbac.js';
import { NotFoundError } from '../../utils/errors.js';

function formatSupplierResponse(supplier: any, canViewSensitive: boolean) {
  if (!supplier) return null;
  const copy = {
    ...supplier,
    totalPurchasesDisplay: '—',
    outstandingBalanceDisplay: '₹0.00',
  };

  if (!canViewSensitive) {
    copy.gstNumber = undefined;
    copy.taxId = undefined;
  }

  return copy;
}

export async function getSuppliers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as any;
    const sortBy = req.query.sortBy as any;
    const sortOrder = req.query.sortOrder as any;

    const result = await supplierRepo.listSuppliers(req.tenantId!, {
      page,
      limit,
      search,
      status,
      sortBy,
      sortOrder,
    });

    const canViewSensitive = hasPermission(
      req.tenantRole,
      'suppliers.view_sensitive',
      req.user?.isPlatformAdmin
    );

    const formattedItems = result.items.map((item: any) =>
      formatSupplierResponse(item, canViewSensitive)
    );

    res.json({
      success: true,
      data: formattedItems,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSupplierById(req: Request, res: Response, next: NextFunction) {
  try {
    const supplier = await supplierRepo.findSupplierById(req.tenantId!, req.params.id);
    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    const canViewSensitive = hasPermission(
      req.tenantRole,
      'suppliers.view_sensitive',
      req.user?.isPlatformAdmin
    );

    res.json({
      success: true,
      data: formatSupplierResponse(supplier, canViewSensitive),
    });
  } catch (error) {
    next(error);
  }
}

export async function createSupplier(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createSupplierSchema.parse(req.body);
    const supplier = await supplierService.createSupplier(req.tenantId!, req.user?.id, body);
    res.status(201).json({
      success: true,
      data: supplier,
      message: 'Supplier created successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSupplier(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateSupplierSchema.parse(req.body);
    const supplier = await supplierService.updateSupplier(
      req.tenantId!,
      req.user?.id,
      req.params.id,
      body
    );
    res.json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function archiveSupplier(req: Request, res: Response, next: NextFunction) {
  try {
    const supplier = await supplierService.archiveSupplier(
      req.tenantId!,
      req.user?.id,
      req.params.id
    );
    res.json({
      success: true,
      data: supplier,
      message: 'Supplier archived successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function restoreSupplier(req: Request, res: Response, next: NextFunction) {
  try {
    const supplier = await supplierService.restoreSupplier(
      req.tenantId!,
      req.user?.id,
      req.params.id
    );
    res.json({
      success: true,
      data: supplier,
      message: 'Supplier restored successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function checkDuplicate(req: Request, res: Response, next: NextFunction) {
  try {
    const params = checkSupplierDuplicateSchema.parse(req.query);
    const duplicates = await supplierRepo.findDuplicateSuppliers(req.tenantId!, params);

    const hasGstMatch = duplicates.some(
      (d: any) => params.gstNumber && d.gstNumber && d.gstNumber.toUpperCase() === params.gstNumber.toUpperCase()
    );

    res.json({
      success: true,
      data: {
        hasDuplicates: duplicates.length > 0,
        hasGstMatch,
        duplicates,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function addAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const body = supplierAddressSchema.parse(req.body);
    const address = await supplierService.addSupplierAddress(
      req.tenantId!,
      req.user?.id,
      req.params.id,
      body
    );
    res.status(201).json({
      success: true,
      data: address,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const body = supplierAddressSchema.partial().parse(req.body);
    const address = await supplierService.updateSupplierAddress(
      req.tenantId!,
      req.user?.id,
      req.params.id,
      req.params.addressId,
      body
    );
    res.json({
      success: true,
      data: address,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAddress(req: Request, res: Response, next: NextFunction) {
  try {
    await supplierService.deleteSupplierAddress(
      req.tenantId!,
      req.user?.id,
      req.params.id,
      req.params.addressId
    );
    res.json({
      success: true,
      message: 'Supplier address deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function addNote(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createNoteSchema.parse(req.body);
    const note = await supplierService.addSupplierNote(
      req.tenantId!,
      req.user?.id,
      req.params.id,
      body.content
    );
    res.status(201).json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteNote(req: Request, res: Response, next: NextFunction) {
  try {
    await supplierService.deleteSupplierNote(
      req.tenantId!,
      req.user?.id,
      req.params.id,
      req.params.noteId
    );
    res.json({
      success: true,
      message: 'Supplier note deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function getSupplierActivities(req: Request, res: Response, next: NextFunction) {
  try {
    const activities = await getCRMActivities(req.tenantId!, {
      entityType: 'SUPPLIER',
      entityId: req.params.id,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    });
    res.json({
      success: true,
      ...activities,
    });
  } catch (error) {
    next(error);
  }
}

export async function exportSuppliers(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await supplierRepo.listSuppliers(req.tenantId!, {
      page: 1,
      limit: 10000,
      status: (req.query.status as any) || 'ALL',
    });

    const headers = ['Supplier Code', 'Name', 'Phone', 'Email', 'GST Number', 'Status', 'Created At'];
    const rows = result.items.map((s: any) => [
      `"${s.supplierCode || ''}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.phone || ''}"`,
      `"${s.email || ''}"`,
      `"${s.gstNumber || ''}"`,
      `"${s.status}"`,
      `"${new Date(s.createdAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=suppliers_${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
}
