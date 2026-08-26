import { prisma } from '../../config/prisma.js';
import { logger } from '../../config/logger.js';

export interface AuditParams {
  userId?: string;
  companyId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: AuditParams) {
  try {
    const log = await prisma.auditLog.create({
      data: {
        userId: params.userId,
        companyId: params.companyId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
    return log;
  } catch (error) {
    logger.error({ error, params }, 'Failed to write Audit Log');
    // Never let audit failure block application execution
    return null;
  }
}
