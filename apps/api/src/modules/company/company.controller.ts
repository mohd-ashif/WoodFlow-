import { Request, Response, NextFunction } from 'express';
import { updateCompanySchema } from '@furniture-os/shared';
import * as service from './company.service.js';
import { CompanyRole, MemberStatus } from '@prisma/client';

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
