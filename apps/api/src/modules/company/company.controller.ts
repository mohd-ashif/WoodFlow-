import { Request, Response, NextFunction } from 'express';
import { updateCompanySchema } from '@furniture-os/shared';
import * as service from './company.service.js';
import { CompanyRole, MemberStatus } from '@prisma/client';
import { z } from 'zod';
import { hashPassword } from '../../utils/auth.js';

const createMemberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  phone: z.string().optional().nullable(),
  role: z.enum(['OWNER', 'MEMBER']).default('MEMBER'),
});

export async function getMyCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const company = await service.getTenantCompany(companyId);
    return res.status(200).json({
      success: true,
      data: { company },
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateMyCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const input = updateCompanySchema.parse(req.body);
    const company = await service.updateTenantCompany(companyId, input);

    return res.status(200).json({
      success: true,
      message: 'Company details updated',
      data: { company },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const members = await service.getCompanyMembers(companyId);
    return res.status(200).json({
      success: true,
      data: { members },
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateRole(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const memberId = req.params.id;
    const { role } = req.body as { role: CompanyRole };

    const member = await service.updateMemberRole(companyId, memberId, role, req.user!.id);

    return res.status(200).json({
      success: true,
      message: 'Member role updated',
      data: { member },
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const memberId = req.params.id;
    const { status } = req.body as { status: MemberStatus };

    const member = await service.updateMemberStatus(companyId, memberId, status, req.user!.id);

    return res.status(200).json({
      success: true,
      message: 'Member status updated',
      data: { member },
    });
  } catch (error) {
    return next(error);
  }
}

export async function createMember(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const input = createMemberSchema.parse(req.body);

    const passwordHash = await hashPassword(input.password);

    const member = await service.createCompanyMember(
      companyId,
      {
        name: input.name,
        email: input.email,
        phone: input.phone || undefined,
        passwordHash,
        role: input.role as any,
      },
      req.user!.id
    );

    return res.status(201).json({
      success: true,
      message: 'Member created successfully',
      data: { member },
    });
  } catch (error) {
    return next(error);
  }
}
