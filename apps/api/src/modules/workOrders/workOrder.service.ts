import { prisma } from '../../config/prisma.js';
import {
  CreateWorkOrderInput,
  UpdateWorkOrderInput,
  CreateProductionTaskInput,
  UpdateTaskStatusInput,
  AssignWorkerTaskInput,
  IssueMaterialInput,
  ReturnMaterialInput,
  QualityCheckInput,
} from '@furniture-os/shared';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { createAuditLog } from '../audit/audit.service.js';

export async function generateNextWorkOrderNumber(tx: any, companyId: string): Promise<string> {
  const count = await tx.workOrder.count({ where: { companyId } });
  const nextNum = count + 1;
  const codeStr = String(nextNum).padStart(6, '0');
  const code = `WO-${codeStr}`;

  const exists = await tx.workOrder.findFirst({ where: { companyId, workOrderNumber: code } });
  if (exists) {
    return `WO-${String(count + 2).padStart(6, '0')}`;
  }
  return code;
}

export async function createWorkOrder(companyId: string, input: CreateWorkOrderInput, userId: string) {
  const db = prisma as any;

  // Validate Customer if provided
  if (input.customerId) {
    const customer = await db.customer.findFirst({
      where: { id: input.customerId, companyId },
    });
    if (!customer) {
      throw new NotFoundError('Customer not found for this company');
    }
  }

  return prisma.$transaction(async (tx: any) => {
    const workOrderNumber = await generateNextWorkOrderNumber(tx, companyId);

    const estimatedTotalCost = input.items.reduce(
      (sum, item) => sum + (item.estimatedUnitCost || 0) * item.quantity,
      0
    );

    const workOrder = await tx.workOrder.create({
      data: {
        companyId,
        workOrderNumber,
        sourceType: input.sourceType || 'MANUAL',
        sourceId: input.sourceId || null,
        customerId: input.customerId || null,
        title: input.title,
        description: input.description || null,
        priority: input.priority || 'MEDIUM',
        status: 'DRAFT',
        startDate: input.startDate ? new Date(input.startDate) : null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        estimatedCost: estimatedTotalCost,
        createdBy: userId,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId || null,
            productNameSnapshot: item.productNameSnapshot,
            customProductName: item.customProductName || null,
            dimensions: item.dimensions || null,
            specifications: item.specifications || null,
            quantity: item.quantity,
            estimatedUnitCost: item.estimatedUnitCost || 0,
            notes: item.notes || null,
          })),
        },
      },
      include: {
        items: true,
        customer: true,
      },
    });

    await createAuditLog({
      userId,
      companyId,
      action: 'WORK_ORDER_CREATED',
      entity: 'WorkOrder',
      entityId: workOrder.id,
      metadata: { workOrderNumber: workOrder.workOrderNumber, title: workOrder.title },
    });

    return workOrder;
  });
}

export async function listWorkOrders(
  companyId: string,
  options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    customerId?: string;
  }
) {
  const db = prisma as any;
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = { companyId };

  if (options.status) {
    where.status = options.status;
  }

  if (options.priority) {
    where.priority = options.priority;
  }

  if (options.customerId) {
    where.customerId = options.customerId;
  }

  if (options.search) {
    const s = options.search.trim();
    where.OR = [
      { workOrderNumber: { contains: s, mode: 'insensitive' } },
      { title: { contains: s, mode: 'insensitive' } },
      { description: { contains: s, mode: 'insensitive' } },
    ];
  }

  const [workOrders, total] = await Promise.all([
    db.workOrder.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true, customerCode: true, phone: true },
        },
        items: true,
        tasks: {
          include: {
            assignments: {
              include: {
                worker: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.workOrder.count({ where }),
  ]);

  const formatted = workOrders.map((wo: any) => {
    const totalTasks = wo.tasks.length;
    const completedTasks = wo.tasks.filter((t: any) => t.status === 'COMPLETED').length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return {
      ...wo,
      progressPercentage,
    };
  });

  return {
    workOrders: formatted,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getWorkOrderById(companyId: string, workOrderId: string) {
  const db = prisma as any;
  const wo = await db.workOrder.findFirst({
    where: { id: workOrderId, companyId },
    include: {
      customer: true,
      creator: { select: { id: true, name: true, email: true } },
      items: {
        include: { product: true },
      },
      tasks: {
        include: {
          assignments: {
            include: { worker: { include: { department: true } } },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      materials: {
        include: { product: true },
      },
      qualityChecks: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!wo) {
    throw new NotFoundError('Work Order not found');
  }

  const totalTasks = wo.tasks.length;
  const completedTasks = wo.tasks.filter((t: any) => t.status === 'COMPLETED').length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    ...wo,
    progressPercentage,
  };
}

export async function updateWorkOrderStatus(
  companyId: string,
  workOrderId: string,
  newStatus: string,
  userId: string
) {
  const db = prisma as any;
  const wo = await db.workOrder.findFirst({
    where: { id: workOrderId, companyId },
  });

  if (!wo) {
    throw new NotFoundError('Work Order not found');
  }

  // Status transitions check
  const allowedTransitions: Record<string, string[]> = {
    DRAFT: ['PLANNED', 'CANCELLED'],
    PLANNED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['ON_HOLD', 'QUALITY_CHECK', 'CANCELLED'],
    ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
    QUALITY_CHECK: ['COMPLETED', 'IN_PROGRESS', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  const validNext = allowedTransitions[wo.status] || [];
  if (!validNext.includes(newStatus) && wo.status !== newStatus) {
    throw new BadRequestError(`Invalid status transition from ${wo.status} to ${newStatus}`);
  }

  const updated = await db.workOrder.update({
    where: { id: workOrderId },
    data: {
      status: newStatus,
      completedDate: newStatus === 'COMPLETED' ? new Date() : wo.completedDate,
    },
  });

  await createAuditLog({
    userId,
    companyId,
    action: 'WORK_ORDER_STATUS_CHANGED',
    entity: 'WorkOrder',
    entityId: workOrderId,
    metadata: { workOrderNumber: wo.workOrderNumber, fromStatus: wo.status, toStatus: newStatus },
  });

  return updated;
}

// PRODUCTION TASKS
export async function createProductionTask(companyId: string, input: CreateProductionTaskInput, userId: string) {
  const db = prisma as any;
  const wo = await db.workOrder.findFirst({
    where: { id: input.workOrderId, companyId },
  });

  if (!wo) {
    throw new NotFoundError('Work Order not found');
  }

  const task = await db.productionTask.create({
    data: {
      companyId,
      workOrderId: input.workOrderId,
      title: input.title,
      description: input.description || null,
      stage: input.stage || 'CARPENTRY',
      priority: input.priority || 'MEDIUM',
      estimatedHours: input.estimatedHours || null,
      status: 'TODO',
    },
  });

  await createAuditLog({
    userId,
    companyId,
    action: 'PRODUCTION_TASK_CREATED',
    entity: 'ProductionTask',
    entityId: task.id,
    metadata: { title: task.title, workOrderNumber: wo.workOrderNumber },
  });

  return task;
}

export async function assignWorkerToTask(
  companyId: string,
  taskId: string,
  input: AssignWorkerTaskInput,
  userId: string
) {
  const db = prisma as any;
  const task = await db.productionTask.findFirst({
    where: { id: taskId, companyId },
  });

  if (!task) {
    throw new NotFoundError('Production task not found');
  }

  // Verify all workers exist in company
  const workers = await db.worker.findMany({
    where: { id: { in: input.workerIds }, companyId, status: 'ACTIVE' },
  });

  if (workers.length !== input.workerIds.length) {
    throw new BadRequestError('One or more workers are invalid or inactive');
  }

  for (const workerId of input.workerIds) {
    await db.productionTaskAssignment.upsert({
      where: {
        productionTaskId_workerId: {
          productionTaskId: taskId,
          workerId,
        },
      },
      update: {
        status: 'ASSIGNED',
        notes: input.notes || undefined,
      },
      create: {
        productionTaskId: taskId,
        workerId,
        assignedBy: userId,
        notes: input.notes || null,
      },
    });
  }

  return db.productionTask.findFirst({
    where: { id: taskId },
    include: {
      assignments: {
        include: { worker: true },
      },
    },
  });
}

export async function updateTaskStatus(companyId: string, taskId: string, input: UpdateTaskStatusInput, userId: string) {
  const db = prisma as any;
  const task = await db.productionTask.findFirst({
    where: { id: taskId, companyId },
  });

  if (!task) {
    throw new NotFoundError('Task not found');
  }

  const updated = await db.productionTask.update({
    where: { id: taskId },
    data: {
      status: input.status,
      actualHours: input.actualHours !== undefined ? input.actualHours : task.actualHours,
      startTime: input.status === 'IN_PROGRESS' && !task.startTime ? new Date() : task.startTime,
      completedTime: input.status === 'COMPLETED' ? new Date() : task.completedTime,
    },
  });

  return updated;
}

// MATERIAL ISSUE & RETURN
export async function issueMaterial(companyId: string, workOrderId: string, input: IssueMaterialInput, userId: string) {
  const db = prisma as any;

  return prisma.$transaction(async (tx: any) => {
    const wo = await tx.workOrder.findFirst({
      where: { id: workOrderId, companyId },
    });

    if (!wo) {
      throw new NotFoundError('Work Order not found');
    }

    if (wo.status === 'CANCELLED' || wo.status === 'COMPLETED') {
      throw new BadRequestError(`Cannot issue materials for a ${wo.status} Work Order`);
    }

    // Row-level lock on inventory record
    const rawInventories: any[] = await tx.$queryRawUnsafe(
      `SELECT * FROM "inventories" WHERE "productId" = $1 AND "companyId" = $2 FOR UPDATE`,
      input.productId,
      companyId
    );

    const inventory = rawInventories[0];
    if (!inventory) {
      throw new BadRequestError('Material inventory record not found');
    }

    const availableQty = (inventory.currentQuantity as number) || 0;
    if (availableQty < input.quantity) {
      throw new BadRequestError(
        `Insufficient material stock. Available: ${availableQty}, Requested: ${input.quantity}`,
        'INSUFFICIENT_STOCK'
      );
    }

    const product = await tx.product.findUnique({ where: { id: input.productId } });

    // Deduct inventory
    const newQty = availableQty - input.quantity;
    await tx.inventory.update({
      where: { id: inventory.id },
      data: {
        currentQuantity: newQty,
        availableQuantity: newQty - (inventory.reservedQuantity || 0),
      },
    });

    await tx.product.update({
      where: { id: input.productId },
      data: { currentStock: newQty },
    });

    // Log Stock Movement: PRODUCTION_ISSUE
    await tx.stockMovement.create({
      data: {
        companyId,
        productId: input.productId,
        movementType: 'PRODUCTION_ISSUE',
        quantity: -input.quantity,
        previousQuantity: availableQty,
        newQuantity: newQty,
        referenceType: 'WORK_ORDER',
        referenceId: wo.id,
        reason: `Material Issued for Work Order #${wo.workOrderNumber}`,
        notes: input.notes || null,
        createdBy: userId,
      },
    });

    // Upsert WorkOrderMaterial record
    const existingMaterial = await tx.workOrderMaterial.findFirst({
      where: { workOrderId, productId: input.productId },
    });

    let materialRecord;
    if (existingMaterial) {
      const issuedQty = existingMaterial.issuedQuantity + input.quantity;
      materialRecord = await tx.workOrderMaterial.update({
        where: { id: existingMaterial.id },
        data: {
          issuedQuantity: issuedQty,
          status: 'ISSUED',
        },
      });
    } else {
      materialRecord = await tx.workOrderMaterial.create({
        data: {
          companyId,
          workOrderId,
          productId: input.productId,
          plannedQuantity: input.quantity,
          issuedQuantity: input.quantity,
          unitCost: product.purchasePrice || 0,
          status: 'ISSUED',
        },
      });
    }

    await createAuditLog({
      userId,
      companyId,
      action: 'MATERIAL_ISSUED',
      entity: 'WorkOrderMaterial',
      entityId: materialRecord.id,
      metadata: { workOrderNumber: wo.workOrderNumber, quantity: input.quantity, productName: product.name },
    });

    return materialRecord;
  }, { maxWait: 15000, timeout: 30000 });
}

export async function returnMaterial(
  companyId: string,
  workOrderId: string,
  materialId: string,
  input: ReturnMaterialInput,
  userId: string
) {
  return prisma.$transaction(async (tx: any) => {
    const material = await tx.workOrderMaterial.findFirst({
      where: { id: materialId, companyId, workOrderId },
      include: { product: true, workOrder: true },
    });

    if (!material) {
      throw new NotFoundError('Material issue record not found');
    }

    const maxReturnable = material.issuedQuantity - material.returnedQuantity;
    if (input.quantity > maxReturnable) {
      throw new BadRequestError(`Cannot return more than issued quantity. Max returnable: ${maxReturnable}`);
    }

    // Lock and restore inventory
    const rawInventories: any[] = await tx.$queryRawUnsafe(
      `SELECT * FROM "inventories" WHERE "productId" = $1 AND "companyId" = $2 FOR UPDATE`,
      material.productId,
      companyId
    );

    let inventory = rawInventories[0];
    const currentQty = (inventory.currentQuantity as number) || 0;
    const newQty = currentQty + input.quantity;

    await tx.inventory.update({
      where: { id: inventory.id },
      data: {
        currentQuantity: newQty,
        availableQuantity: newQty - (inventory.reservedQuantity || 0),
      },
    });

    await tx.product.update({
      where: { id: material.productId },
      data: { currentStock: newQty },
    });

    // Log Stock Movement: PRODUCTION_RETURN
    await tx.stockMovement.create({
      data: {
        companyId,
        productId: material.productId,
        movementType: 'PRODUCTION_RETURN',
        quantity: input.quantity,
        previousQuantity: currentQty,
        newQuantity: newQty,
        referenceType: 'WORK_ORDER_MATERIAL_RETURN',
        referenceId: material.id,
        reason: `Material Returned from Work Order #${material.workOrder.workOrderNumber}: ${input.reason || ''}`,
        createdBy: userId,
      },
    });

    const updatedMaterial = await tx.workOrderMaterial.update({
      where: { id: material.id },
      data: {
        returnedQuantity: material.returnedQuantity + input.quantity,
        status: material.returnedQuantity + input.quantity >= material.issuedQuantity ? 'RETURNED' : material.status,
      },
    });

    return updatedMaterial;
  }, { maxWait: 15000, timeout: 30000 });
}

// QUALITY CONTROL
export async function performQualityCheck(companyId: string, workOrderId: string, input: QualityCheckInput, userId: string) {
  const db = prisma as any;
  const wo = await db.workOrder.findFirst({
    where: { id: workOrderId, companyId },
  });

  if (!wo) {
    throw new NotFoundError('Work Order not found');
  }

  const check = await db.qualityCheck.create({
    data: {
      companyId,
      workOrderId,
      status: input.status,
      checkedBy: userId,
      checkedAt: new Date(),
      notes: input.notes || null,
      issuesFound: input.issuesFound || null,
    },
  });

  if (input.status === 'PASSED') {
    await db.workOrder.update({
      where: { id: workOrderId },
      data: { status: 'QUALITY_CHECK' },
    });
  }

  await createAuditLog({
    userId,
    companyId,
    action: input.status === 'PASSED' ? 'QUALITY_CHECK_PASSED' : 'QUALITY_CHECK_FAILED',
    entity: 'QualityCheck',
    entityId: check.id,
    metadata: { workOrderNumber: wo.workOrderNumber, status: input.status },
  });

  return check;
}

// COMPLETE WORK ORDER & FINISHED GOODS OUTPUT
export async function completeWorkOrder(companyId: string, workOrderId: string, userId: string) {
  return prisma.$transaction(async (tx: any) => {
    const wo = await tx.workOrder.findFirst({
      where: { id: workOrderId, companyId },
      include: { items: true },
    });

    if (!wo) {
      throw new NotFoundError('Work Order not found');
    }

    if (wo.status === 'COMPLETED') {
      throw new BadRequestError('Work Order is already completed');
    }

    // Add produced items to Finished Goods Inventory
    for (const item of wo.items) {
      if (!item.productId) continue;

      const rawInventories: any[] = await tx.$queryRawUnsafe(
        `SELECT * FROM "inventories" WHERE "productId" = $1 AND "companyId" = $2 FOR UPDATE`,
        item.productId,
        companyId
      );

      let inventory = rawInventories[0];
      if (!inventory) {
        inventory = await tx.inventory.create({
          data: {
            companyId,
            productId: item.productId,
            currentQuantity: 0,
            availableQuantity: 0,
            reservedQuantity: 0,
          },
        });
      }

      const currentQty = (inventory.currentQuantity as number) || 0;
      const newQty = currentQty + item.quantity;

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          currentQuantity: newQty,
          availableQuantity: newQty - (inventory.reservedQuantity || 0),
        },
      });

      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: newQty },
      });

      await tx.stockMovement.create({
        data: {
          companyId,
          productId: item.productId,
          movementType: 'PRODUCTION_OUTPUT',
          quantity: item.quantity,
          previousQuantity: currentQty,
          newQuantity: newQty,
          referenceType: 'WORK_ORDER_COMPLETION',
          referenceId: wo.id,
          reason: `Finished Goods Produced for Work Order #${wo.workOrderNumber}`,
          createdBy: userId,
        },
      });
    }

    const completed = await tx.workOrder.update({
      where: { id: wo.id },
      data: {
        status: 'COMPLETED',
        completedDate: new Date(),
      },
    });

    await createAuditLog({
      userId,
      companyId,
      action: 'WORK_ORDER_COMPLETED',
      entity: 'WorkOrder',
      entityId: wo.id,
      metadata: { workOrderNumber: wo.workOrderNumber },
    });

    return completed;
  }, { maxWait: 15000, timeout: 30000 });
}

// PRODUCTION DASHBOARD METRICS
export async function getProductionDashboardStats(companyId: string) {
  const db = prisma as any;

  const [
    totalWorkOrders,
    draftWorkOrders,
    plannedWorkOrders,
    inProgressWorkOrders,
    qualityCheckWorkOrders,
    completedWorkOrders,
    overdueWorkOrders,
    activeWorkersToday,
  ] = await Promise.all([
    db.workOrder.count({ where: { companyId } }),
    db.workOrder.count({ where: { companyId, status: 'DRAFT' } }),
    db.workOrder.count({ where: { companyId, status: 'PLANNED' } }),
    db.workOrder.count({ where: { companyId, status: 'IN_PROGRESS' } }),
    db.workOrder.count({ where: { companyId, status: 'QUALITY_CHECK' } }),
    db.workOrder.count({ where: { companyId, status: 'COMPLETED' } }),
    db.workOrder.count({
      where: {
        companyId,
        status: { in: ['PLANNED', 'IN_PROGRESS', 'QUALITY_CHECK'] },
        dueDate: { lt: new Date() },
      },
    }),
    db.worker.count({ where: { companyId, status: 'ACTIVE' } }),
  ]);

  return {
    totalWorkOrders,
    draftWorkOrders,
    plannedWorkOrders,
    inProgressWorkOrders,
    qualityCheckWorkOrders,
    completedWorkOrders,
    overdueWorkOrders,
    activeWorkersToday,
  };
}
