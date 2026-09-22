import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../utils/errors.js';

export interface ProductionCostReport {
  workOrderId: string;
  workOrderNumber: string;
  title: string;
  plannedCost: number;
  actualCost: number;
  costVariance: number;
  variancePercentage: number;
  breakdown: {
    materialCost: number;
    laborCost: number;
    machineCost: number;
    overheadCost: number;
    scrapCost: number;
  };
}

export async function calculateWorkOrderCost(companyId: string, workOrderId: string): Promise<ProductionCostReport> {
  const db = prisma as any;

  const wo = await db.workOrder.findFirst({
    where: { id: workOrderId, companyId },
    include: {
      materials: true,
      tasks: {
        include: {
          assignments: {
            include: { worker: true },
          },
        },
      },
      scraps: true,
      items: true,
    },
  });

  if (!wo) {
    throw new NotFoundError('Work order not found');
  }

  // 1. Material Cost: Sum of (consumedQuantity * unitCost)
  const materialCost = wo.materials.reduce((sum: number, mat: any) => {
    const qty = mat.consumedQuantity > 0 ? mat.consumedQuantity : mat.issuedQuantity;
    return sum + qty * (mat.unitCost || 0);
  }, 0);

  // 2. Labor Cost: Sum of (actualHours * hourlyWage)
  let laborCost = 0;
  for (const task of wo.tasks) {
    const hours = task.actualHours || task.estimatedHours || 0;
    for (const assign of task.assignments) {
      const workerWage = assign.worker?.dailyWage ? assign.worker.dailyWage / 8 : 150; // default hourly
      laborCost += hours * workerWage;
    }
  }

  // 3. Machine Cost: Estimated hourly machine rate (default 100/hr)
  const totalMachineHours = wo.tasks.reduce((sum: number, t: any) => sum + (t.actualHours || t.estimatedHours || 0), 0);
  const machineCost = totalMachineHours * 100;

  // 4. Scrap Cost: Sum of scrap costs
  const scrapCost = wo.scraps.reduce((sum: number, s: any) => sum + (s.cost || 0), 0);

  // 5. Manufacturing Settings Overhead
  const settings = await db.manufacturingSettings.findUnique({
    where: { companyId },
  });

  const overheadPercent = settings?.defaultOverheadPercent || 5.0;
  const directCost = materialCost + laborCost + machineCost + scrapCost;
  const overheadCost = directCost * (overheadPercent / 100);

  const actualTotalCost = directCost + overheadCost;
  const plannedCost = wo.estimatedCost || 0;
  const costVariance = actualTotalCost - plannedCost;
  const variancePercentage = plannedCost > 0 ? Math.round((costVariance / plannedCost) * 100) : 0;

  // Update actual cost on work order
  await db.workOrder.update({
    where: { id: workOrderId },
    data: { actualCost: actualTotalCost },
  });

  return {
    workOrderId: wo.id,
    workOrderNumber: wo.workOrderNumber,
    title: wo.title,
    plannedCost,
    actualCost: actualTotalCost,
    costVariance,
    variancePercentage,
    breakdown: {
      materialCost,
      laborCost,
      machineCost,
      overheadCost,
      scrapCost,
    },
  };
}
