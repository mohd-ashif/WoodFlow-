import { prisma } from '../../config/prisma.js';
import { createAuditLog } from '../audit/audit.service.js';

export async function getManufacturingSettings(companyId: string) {
  const db = prisma as any;

  let settings = await db.manufacturingSettings.findUnique({
    where: { companyId },
  });

  if (!settings) {
    settings = await db.manufacturingSettings.create({
      data: {
        companyId,
        defaultRawMaterialLocation: 'RAW_MATERIAL_STORE',
        defaultWipLocation: 'WIP_LOCATION',
        defaultFinishedGoodsLocation: 'FINISHED_GOODS_STORE',
        requireQC: true,
        allowNegativeStock: false,
        autoRunMRP: false,
        autoReserveStock: false,
        autoCreatePurchaseRequest: false,
        autoCreateWorkOrder: false,
        requireProductionApproval: false,
        requireQCBeforeFinishedStock: true,
        defaultWastagePercent: 2.0,
        defaultOverheadPercent: 5.0,
        defaultCostingMethod: 'ACTUAL',
      },
    });
  }

  return settings;
}

export async function updateManufacturingSettings(companyId: string, input: any, userId: string) {
  const db = prisma as any;

  const updated = await db.manufacturingSettings.upsert({
    where: { companyId },
    update: {
      ...input,
      updatedAt: new Date(),
    },
    create: {
      companyId,
      ...input,
    },
  });

  // Also sync allowNegativeStock to Company table if provided
  if (input.allowNegativeStock !== undefined) {
    await db.company.update({
      where: { id: companyId },
      data: { allowNegativeStock: input.allowNegativeStock },
    });
  }

  await createAuditLog({
    userId,
    companyId,
    action: 'MANUFACTURING_SETTINGS_UPDATED',
    entity: 'ManufacturingSettings',
    entityId: updated.id,
    metadata: { ...input },
  });

  return updated;
}
