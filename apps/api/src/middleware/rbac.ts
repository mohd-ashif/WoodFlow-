import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import { CompanyRole } from '@prisma/client';

export function requirePlatformAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedError());
  }

  if (!req.user.isPlatformAdmin) {
    return next(
      new ForbiddenError('Access restricted to Platform Administrators', 'REQUIRE_PLATFORM_ADMIN')
    );
  }

  next();
}

export function requireRoles(allowedRoles: CompanyRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (req.user.isPlatformAdmin) {
      return next();
    }

    if (!req.tenantRole || !allowedRoles.includes(req.tenantRole)) {
      return next(
        new ForbiddenError(
          `Action requires one of the following roles: ${allowedRoles.join(', ')}`,
          'INSUFFICIENT_ROLE_PERMISSIONS'
        )
      );
    }

    next();
  };
}

export function hasPermission(
  role: CompanyRole | string | null | undefined,
  permission: string,
  isPlatformAdmin = false
): boolean {
  if (isPlatformAdmin) return true;
  if (!role) return false;

  const userRole = String(role);

  if (userRole === 'OWNER') return true;

  if (userRole === 'MANAGER') {
    const managerPermissions = [
      'customers.view',
      'customers.create',
      'customers.update',
      'customers.archive',
      'customers.export',
      'suppliers.view',
      'suppliers.create',
      'suppliers.update',
      'suppliers.archive',
      'suppliers.export',
      'crm.dashboard.view',
      'crm.activity.view',
      'crm.activity.create',
      'sales.view',
      'sales.create',
      'sales.cancel',
      'invoices.view',
      'purchases.view',
      'purchases.create',
      'purchases.cancel',
    ];
    return managerPermissions.includes(permission);
  }

  if (userRole === 'STAFF' || userRole === 'MEMBER') {
    const staffPermissions = [
      'customers.view',
      'customers.create',
      'customers.update',
      'suppliers.view',
      'crm.dashboard.view',
      'crm.activity.view',
      'crm.activity.create',
      'sales.view',
      'sales.create',
      'invoices.view',
      'purchases.view',
      'purchases.create',
      'products.view',
      'inventory.view',
    ];
    return staffPermissions.includes(permission);
  }

  if (userRole === 'WORKER') {
    const workerPermissions = [
      'products.view',
      'inventory.view',
      'crm.activity.view',
    ];
    return workerPermissions.includes(permission);
  }

  return false;
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    const isAllowed = hasPermission(
      req.tenantRole,
      permission,
      req.user.isPlatformAdmin
    );

    if (!isAllowed) {
      return next(
        new ForbiddenError(
          `Permission denied: '${permission}' required`,
          'INSUFFICIENT_PERMISSIONS'
        )
      );
    }

    next();
  };
}

