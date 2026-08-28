import { Request, Response, NextFunction } from 'express';
import * as customerService from './customer.service.js';
import * as customerRepo from './customer.repository.js';
import { getCRMActivities } from '../crm/activity.service.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerAddressSchema,
  createNoteSchema,
  checkCustomerDuplicateSchema,
} from '@furniture-os/shared';
import { hasPermission } from '../../middleware/rbac.js';
import { NotFoundError } from '../../utils/errors.js';

function formatCustomerResponse(customer: any, canViewSensitive: boolean) {
  if (!customer) return null;
  const copy = {
    ...customer,
    totalOrdersDisplay: '—',
    outstandingBalanceDisplay: '₹0.00',
  };

  if (!canViewSensitive) {
    copy.gstNumber = undefined;
    copy.taxId = undefined;
  }

  return copy;
}

export async function getCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as any;
    const sortBy = req.query.sortBy as any;
    const sortOrder = req.query.sortOrder as any;

    const result = await customerRepo.listCustomers(req.tenantId!, {
      page,
      limit,
      search,
      status,
      sortBy,
      sortOrder,
    });

    const canViewSensitive = hasPermission(
      req.tenantRole,
      'customers.view_sensitive',
      req.user?.isPlatformAdmin
    );

    const formattedItems = result.items.map((item: any) =>
      formatCustomerResponse(item, canViewSensitive)
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

export async function getCustomerById(req: Request, res: Response, next: NextFunction) {
  try {
    const customer = await customerRepo.findCustomerById(req.tenantId!, req.params.id);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    const canViewSensitive = hasPermission(
      req.tenantRole,
      'customers.view_sensitive',
      req.user?.isPlatformAdmin
    );

    res.json({
      success: true,
      data: formatCustomerResponse(customer, canViewSensitive),
    });
  } catch (error) {
    next(error);
  }
}

export async function createCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createCustomerSchema.parse(req.body);
    const customer = await customerService.createCustomer(req.tenantId!, req.user?.id, body);
    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateCustomerSchema.parse(req.body);
    const customer = await customerService.updateCustomer(
      req.tenantId!,
      req.user?.id,
      req.params.id,
      body
    );
    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function archiveCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const customer = await customerService.archiveCustomer(
      req.tenantId!,
      req.user?.id,
      req.params.id
    );
    res.json({
      success: true,
      data: customer,
      message: 'Customer archived successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function restoreCustomer(req: Request, res: Response, next: NextFunction) {
  try {
    const customer = await customerService.restoreCustomer(
      req.tenantId!,
      req.user?.id,
      req.params.id
    );
    res.json({
      success: true,
      data: customer,
      message: 'Customer restored successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function checkDuplicate(req: Request, res: Response, next: NextFunction) {
  try {
    const params = checkCustomerDuplicateSchema.parse(req.query);
    const duplicates = await customerRepo.findDuplicateCustomers(req.tenantId!, params);
    res.json({
      success: true,
      data: {
        hasDuplicates: duplicates.length > 0,
        duplicates,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function addAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const body = customerAddressSchema.parse(req.body);
    const address = await customerService.addCustomerAddress(
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
    const body = customerAddressSchema.partial().parse(req.body);
    const address = await customerService.updateCustomerAddress(
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
    await customerService.deleteCustomerAddress(
      req.tenantId!,
      req.user?.id,
      req.params.id,
      req.params.addressId
    );
    res.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function addNote(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createNoteSchema.parse(req.body);
    const note = await customerService.addCustomerNote(
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
    await customerService.deleteCustomerNote(
      req.tenantId!,
      req.user?.id,
      req.params.id,
      req.params.noteId
    );
    res.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerActivities(req: Request, res: Response, next: NextFunction) {
  try {
    const activities = await getCRMActivities(req.tenantId!, {
      entityType: 'CUSTOMER',
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

export async function exportCustomers(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await customerRepo.listCustomers(req.tenantId!, {
      page: 1,
      limit: 10000,
      status: req.query.status as any || 'ALL',
    });

    const headers = ['Customer Code', 'Name', 'Phone', 'Email', 'GST Number', 'Status', 'Created At'];
    const rows: string[][] = (result.items as any[]).map((c: any) => [
      `"${c.customerCode || ''}"`,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone || ''}"`,
      `"${c.email || ''}"`,
      `"${c.gstNumber || ''}"`,
      `"${c.status}"`,
      `"${new Date(c.createdAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=customers_${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
}
