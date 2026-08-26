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
