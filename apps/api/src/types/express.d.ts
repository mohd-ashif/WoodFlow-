import { Request } from 'express';
import { User, CompanyMember, CompanyRole } from '@prisma/client';

export interface AuthenticatedUser extends User {
  isPlatformAdmin: boolean;
  memberships: (CompanyMember & {
    company: {
      id: string;
      name: string;
      slug: string;
      status: string;
    };
  })[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      tenantId?: string;
      tenantRole?: CompanyRole;
    }
  }
}
