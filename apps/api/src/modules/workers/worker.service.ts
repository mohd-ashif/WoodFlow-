import { prisma } from '../../config/prisma.js';
import { CreateWorkerInput, UpdateWorkerInput, CreateDepartmentInput, UpdateDepartmentInput, RecordAttendanceInput } from '@furniture-os/shared';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { createAuditLog } from '../audit/audit.service.js';

// DEPARTMENT SERVICES
export async function listDepartments(companyId: string) {
  const db = prisma as any;
  return db.department.findMany({
    where: { companyId },
    include: {
      _count: {
        select: { workers: true },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function createDepartment(companyId: string, input: CreateDepartmentInput, actorUserId: string) {
  const db = prisma as any;
  const existing = await db.department.findFirst({
    where: { companyId, name: { equals: input.name, mode: 'insensitive' } },
  });

  if (existing) {
    throw new BadRequestError(`Department with name "${input.name}" already exists`);
  }

  const department = await db.department.create({
    data: {
      companyId,
      name: input.name,
      description: input.description || null,
    },
  });

  await createAuditLog({
    userId: actorUserId,
    companyId,
    action: 'DEPARTMENT_CREATED',
    entity: 'Department',
    entityId: department.id,
    metadata: { name: department.name },
  });

  return department;
}

export async function updateDepartment(companyId: string, departmentId: string, input: UpdateDepartmentInput, actorUserId: string) {
  const db = prisma as any;
  const dept = await db.department.findFirst({
    where: { id: departmentId, companyId },
  });

  if (!dept) {
    throw new NotFoundError('Department not found');
  }

  const updated = await db.department.update({
    where: { id: departmentId },
    data: {
      name: input.name ?? dept.name,
      description: input.description !== undefined ? input.description : dept.description,
      status: input.status ?? dept.status,
    },
  });

  await createAuditLog({
    userId: actorUserId,
    companyId,
    action: 'DEPARTMENT_UPDATED',
    entity: 'Department',
    entityId: departmentId,
    metadata: { name: updated.name },
  });

  return updated;
}

// WORKER SERVICES
export async function generateNextEmployeeCode(tx: any, companyId: string): Promise<string> {
  const count = await tx.worker.count({ where: { companyId } });
  const nextNum = count + 1;
  const codeStr = String(nextNum).padStart(6, '0');
  const code = `WRK-${codeStr}`;

  const exists = await tx.worker.findFirst({ where: { companyId, employeeCode: code } });
  if (exists) {
    return `WRK-${String(count + 2).padStart(6, '0')}`;
  }
  return code;
}

export async function listWorkers(
  companyId: string,
  options: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    status?: string;
  }
) {
  const db = prisma as any;
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = { companyId };

  if (options.departmentId) {
    where.departmentId = options.departmentId;
  }

  if (options.status) {
    where.status = options.status;
  }

  if (options.search) {
    const s = options.search.trim();
    where.OR = [
      { firstName: { contains: s, mode: 'insensitive' } },
      { lastName: { contains: s, mode: 'insensitive' } },
      { employeeCode: { contains: s, mode: 'insensitive' } },
      { phone: { contains: s, mode: 'insensitive' } },
      { email: { contains: s, mode: 'insensitive' } },
    ];
  }

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const safeSkip = (safePage - 1) * safeLimit;

  const [workers, total] = await Promise.all([
    db.worker.findMany({
      where,
      select: {
        id: true,
        companyId: true,
        departmentId: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        employmentType: true,
        dailyWageRate: true,
        monthlySalary: true,
        status: true,
        joinedDate: true,
        createdAt: true,
        updatedAt: true,
        department: {
          select: { id: true, name: true },
        },
        skills: {
          select: {
            id: true,
            skillName: true,
            proficiencyLevel: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: safeSkip,
      take: safeLimit,
    }),
    db.worker.count({ where }),
  ]);

  return {
    workers,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

export async function getWorkerById(companyId: string, workerId: string) {
  const db = prisma as any;
  const worker = await db.worker.findFirst({
    where: { id: workerId, companyId },
    include: {
      department: true,
      skills: true,
      assignments: {
        include: {
          task: {
            include: {
              workOrder: true,
            },
          },
        },
        orderBy: { assignedAt: 'desc' },
        take: 20,
      },
      attendance: {
        orderBy: { date: 'desc' },
        take: 30,
      },
    },
  });

  if (!worker) {
    throw new NotFoundError('Worker not found');
  }

  return worker;
}

export async function createWorker(companyId: string, input: CreateWorkerInput, actorUserId: string) {
  const db = prisma as any;

  return prisma.$transaction(async (tx: any) => {
    const employeeCode = await generateNextEmployeeCode(tx, companyId);

    const worker = await tx.worker.create({
      data: {
        companyId,
        employeeCode,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone || null,
        email: input.email || null,
        address: input.address || null,
        departmentId: input.departmentId || null,
        employmentType: input.employmentType || 'FULL_TIME',
        joiningDate: input.joiningDate ? new Date(input.joiningDate) : new Date(),
        dailyWage: input.dailyWage || null,
        monthlySalary: input.monthlySalary || null,
        notes: input.notes || null,
        status: 'ACTIVE',
        skills: input.skills && input.skills.length > 0
          ? {
              create: input.skills.map((skillName) => ({
                skillName,
              })),
            }
          : undefined,
      },
      include: {
        department: true,
        skills: true,
      },
    });

    await createAuditLog({
      userId: actorUserId,
      companyId,
      action: 'WORKER_CREATED',
      entity: 'Worker',
      entityId: worker.id,
      metadata: { employeeCode: worker.employeeCode, name: `${worker.firstName} ${worker.lastName}` },
    });

    return worker;
  });
}

export async function updateWorker(companyId: string, workerId: string, input: UpdateWorkerInput, actorUserId: string) {
  const db = prisma as any;
  const worker = await db.worker.findFirst({
    where: { id: workerId, companyId },
  });

  if (!worker) {
    throw new NotFoundError('Worker not found');
  }

  const updated = await db.worker.update({
    where: { id: workerId },
    data: {
      firstName: input.firstName ?? worker.firstName,
      lastName: input.lastName ?? worker.lastName,
      phone: input.phone !== undefined ? input.phone : worker.phone,
      email: input.email !== undefined ? input.email : worker.email,
      address: input.address !== undefined ? input.address : worker.address,
      departmentId: input.departmentId !== undefined ? input.departmentId : worker.departmentId,
      employmentType: input.employmentType ?? worker.employmentType,
      joiningDate: input.joiningDate ? new Date(input.joiningDate) : worker.joiningDate,
      dailyWage: input.dailyWage !== undefined ? input.dailyWage : worker.dailyWage,
      monthlySalary: input.monthlySalary !== undefined ? input.monthlySalary : worker.monthlySalary,
      notes: input.notes !== undefined ? input.notes : worker.notes,
      status: input.status ?? worker.status,
    },
    include: {
      department: true,
      skills: true,
    },
  });

  await createAuditLog({
    userId: actorUserId,
    companyId,
    action: 'WORKER_UPDATED',
    entity: 'Worker',
    entityId: workerId,
    metadata: { employeeCode: updated.employeeCode, status: updated.status },
  });

  return updated;
}

// ATTENDANCE SERVICES
export async function recordAttendance(companyId: string, input: RecordAttendanceInput, actorUserId: string) {
  const db = prisma as any;
  const worker = await db.worker.findFirst({
    where: { id: input.workerId, companyId },
  });

  if (!worker) {
    throw new NotFoundError('Worker not found');
  }

  const attendanceDate = new Date(input.date);
  attendanceDate.setHours(0, 0, 0, 0);

  const attendance = await db.workerAttendance.upsert({
    where: {
      workerId_date: {
        workerId: input.workerId,
        date: attendanceDate,
      },
    },
    update: {
      status: input.status,
      checkIn: input.checkIn ? new Date(input.checkIn) : undefined,
      checkOut: input.checkOut ? new Date(input.checkOut) : undefined,
      notes: input.notes || undefined,
    },
    create: {
      companyId,
      workerId: input.workerId,
      date: attendanceDate,
      status: input.status,
      checkIn: input.checkIn ? new Date(input.checkIn) : null,
      checkOut: input.checkOut ? new Date(input.checkOut) : null,
      notes: input.notes || null,
    },
  });

  return attendance;
}
