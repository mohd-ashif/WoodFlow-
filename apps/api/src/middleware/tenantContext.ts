import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import { MemberStatus, CompanyStatus } from '@prisma/client';

export function tenantContext(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  // Platform Admins can bypass tenant requirement if accessing admin routes
  if (req.user.isPlatformAdmin && req.path.startsWith('/admin')) {
    return next();
  }

  const requestedCompanyId = req.headers['x-company-id'] as string | undefined;

  let activeMembership = req.user.memberships.find((m) => m.status === MemberStatus.ACTIVE);

  // If specific company requested via header, verify user is member of that company
  if (requestedCompanyId) {
    activeMembership = req.user.memberships.find(
      (m) => m.companyId === requestedCompanyId && m.status === MemberStatus.ACTIVE
    );
  }

  if (!activeMembership) {
    return next(
      new ForbiddenError(
        'Access denied. No active company membership found for user.',
        'NO_COMPANY_MEMBERSHIP'
      )
    );
  }

  if (activeMembership.company.status !== CompanyStatus.ACTIVE) {
    return next(
      new ForbiddenError('Access denied. Company is currently suspended.', 'COMPANY_NOT_ACTIVE')
    );
  }

  // Securely set tenantId from verified membership on server side
  req.tenantId = activeMembership.companyId;
  req.tenantRole = activeMembership.role;

  next();
}
