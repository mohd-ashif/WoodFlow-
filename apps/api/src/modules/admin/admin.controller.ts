import { Request, Response, NextFunction } from 'express';
import { createCompanySchema, updateCompanySchema } from '@furniture-os/shared';
import * as adminService from './admin.service.js';
import * as companyService from '../company/company.service.js';
import * as accessRequestService from '../accessRequest/accessRequest.service.js';
import { CompanyStatus, UserStatus, CompanyRole, AccessRequestStatus } from '@prisma/client';

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await adminService.getAdminDashboardStats();
    return res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    return next(error);
  }
}

export async function listCompanies(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const status = req.query.status as CompanyStatus | undefined;

    const result = await adminService.getAllCompaniesForAdmin({ page, limit, search, status });
    return res.status(200).json({
      success: true,
      data: { companies: result.companies },
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createCompanySchema.parse(req.body);
    const adminId = req.user!.id;
    const result = await companyService.createCompanyWithOnboarding(
      input,
      adminId,
      req.ip,
      req.get('user-agent')
    );

    return res.status(201).json({
      success: true,
      message: 'Company created and onboarded successfully',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await adminService.getCompanyDetailsForAdmin(req.params.id);
    return res.status(200).json({
      success: true,
      data: { company },
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateCompanySchema.parse(req.body);
    const company = await companyService.updateCompany(req.params.id, input, req.user!.id);
    return res.status(200).json({
      success: true,
      message: 'Company updated',
      data: { company },
    });
  } catch (error) {
    return next(error);
  }
}

export async function suspendCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await companyService.setCompanyStatus(
      req.params.id,
      CompanyStatus.SUSPENDED,
      req.user!.id,
      req.ip,
      req.get('user-agent')
    );
    return res.status(200).json({
      success: true,
      message: 'Company suspended',
      data: { company },
    });
  } catch (error) {
    return next(error);
  }
}

export async function activateCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await companyService.setCompanyStatus(
      req.params.id,
      CompanyStatus.ACTIVE,
      req.user!.id,
      req.ip,
      req.get('user-agent')
    );
    return res.status(200).json({
      success: true,
      message: 'Company activated',
      data: { company },
    });
  } catch (error) {
    return next(error);
  }
}

export async function listAccessRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const status = req.query.status as AccessRequestStatus | undefined;

    const result = await adminService.getAllAccessRequestsForAdmin({ page, limit, search, status });
    return res.status(200).json({
      success: true,
      data: { requests: result.requests },
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getAccessRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const request = await adminService.getAccessRequestById(req.params.id);
    return res.status(200).json({
      success: true,
      data: { request },
    });
  } catch (error) {
    return next(error);
  }
}

export async function approveAccessRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const { option, companyId, companyDetails, role } = req.body;
    const request = await accessRequestService.approveAccessRequest(
      req.params.id,
      req.user!.id,
      { option, companyId, companyDetails, role },
      req.ip,
      req.get('user-agent')
    );
    return res.status(200).json({
      success: true,
      message: 'Access request approved',
      data: { request },
    });
  } catch (error) {
    return next(error);
  }
}

export async function rejectAccessRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const request = await accessRequestService.rejectAccessRequest(
      req.params.id,
      req.user!.id,
      req.ip,
      req.get('user-agent')
    );
    return res.status(200).json({
      success: true,
      message: 'Access request rejected',
      data: { request },
    });
  } catch (error) {
    return next(error);
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const filter = req.query.filter as string | undefined;

    const result = await adminService.getAllUsersForAdmin({ page, limit, search, filter });
    return res.status(200).json({
      success: true,
      data: { users: result.users },
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getUserDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await adminService.getUserByIdForAdmin(req.params.id);
    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateUserStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.body as { status: UserStatus };
    const user = await adminService.updateUserStatus(req.params.id, status, req.user!.id);
    return res.status(200).json({
      success: true,
      message: 'User status updated',
      data: { user },
    });
  } catch (error) {
    return next(error);
  }
}

export async function assignUserCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId, role } = req.body as { companyId: string; role: CompanyRole };
    const membership = await adminService.assignUserToCompany(
      req.params.id,
      companyId,
      role,
      req.user!.id
    );
    return res.status(200).json({
      success: true,
      message: 'User assigned to company',
      data: { membership },
    });
  } catch (error) {
    return next(error);
  }
}

export async function removeUserCompany(req: Request, res: Response, next: NextFunction) {
  try {
    const { companyId } = req.params;
    await adminService.removeUserFromCompany(req.params.id, companyId, req.user!.id);
    return res.status(200).json({
      success: true,
      message: 'User removed from company',
    });
  } catch (error) {
    return next(error);
  }
}

export async function listActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const companyId = req.query.companyId as string | undefined;
    const action = req.query.action as string | undefined;

    const result = await adminService.listActivityLogs({ page, limit, search, companyId, action });
    return res.status(200).json({
      success: true,
      data: { logs: result.logs },
      pagination: result.pagination,
    });
  } catch (error) {
    return next(error);
  }
}
