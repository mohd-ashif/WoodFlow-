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
  role: CompanyRole | null | undefined,
  permission: string,
  isPlatformAdmin = false
): boolean {
  if (isPlatformAdmin) return true;
  if (!role) return false;

  if (role === 'OWNER') return true;

  if ((role as string) === 'MANAGER') {
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
    ];
    return managerPermissions.includes(permission);
  }

  if (role === 'MEMBER') {
    // Represents STAFF
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
    ];
    return staffPermissions.includes(permission);
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

