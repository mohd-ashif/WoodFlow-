import { Request, Response, NextFunction } from 'express';
import * as workerService from './worker.service.js';
import {
  createWorkerSchema,
  updateWorkerSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  recordAttendanceSchema,
} from '@furniture-os/shared';

// DEPARTMENTS
export async function getDepartments(req: Request, res: Response, next: NextFunction) {
  try {
    const departments = await workerService.listDepartments(req.tenantId!);
    return res.json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
}

export async function createDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createDepartmentSchema.parse(req.body);
    const department = await workerService.createDepartment(req.tenantId!, input, req.user!.id);
    return res.status(201).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
}

export async function updateDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateDepartmentSchema.parse(req.body);
    const department = await workerService.updateDepartment(req.tenantId!, req.params.id, input, req.user!.id);
    return res.json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
}

// WORKERS
export async function getWorkers(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await workerService.listWorkers(req.tenantId!, {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      search: req.query.search as string,
      departmentId: req.query.departmentId as string,
      status: req.query.status as string,
    });
    return res.json({ success: true, data: result.workers, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
}

export async function getWorker(req: Request, res: Response, next: NextFunction) {
  try {
    const worker = await workerService.getWorkerById(req.tenantId!, req.params.id);
    return res.json({ success: true, data: worker });
  } catch (error) {
    next(error);
  }
}

export async function createWorker(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createWorkerSchema.parse(req.body);
    const worker = await workerService.createWorker(req.tenantId!, input, req.user!.id);
    return res.status(201).json({ success: true, data: worker });
  } catch (error) {
    next(error);
  }
}

export async function updateWorker(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateWorkerSchema.parse(req.body);
    const worker = await workerService.updateWorker(req.tenantId!, req.params.id, input, req.user!.id);
    return res.json({ success: true, data: worker });
  } catch (error) {
    next(error);
  }
}

// ATTENDANCE
export async function recordAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const input = recordAttendanceSchema.parse(req.body);
    const attendance = await workerService.recordAttendance(req.tenantId!, input, req.user!.id);
    return res.json({ success: true, data: attendance });
  } catch (error) {
    next(error);
  }
}
