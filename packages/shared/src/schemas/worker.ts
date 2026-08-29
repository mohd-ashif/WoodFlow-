import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(100),
  description: z.string().optional().nullable(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const createWorkerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'DAILY_WAGE']).default('FULL_TIME'),
  joiningDate: z.string().optional().nullable(),
  dailyWage: z.number().nonnegative().optional().nullable(),
  monthlySalary: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
  skills: z.array(z.string()).optional(),
});

export const updateWorkerSchema = createWorkerSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']).optional(),
});

export const recordAttendanceSchema = z.object({
  workerId: z.string().min(1, 'Worker ID is required'),
  date: z.string().min(1, 'Date is required'),
  status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE']),
  checkIn: z.string().optional().nullable(),
  checkOut: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CreateWorkerInput = z.infer<typeof createWorkerSchema>;
export type UpdateWorkerInput = z.infer<typeof updateWorkerSchema>;
export type RecordAttendanceInput = z.infer<typeof recordAttendanceSchema>;
