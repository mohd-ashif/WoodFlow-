import crypto from 'crypto';
import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../utils/errors.js';
import { createAuditLog } from '../audit/audit.service.js';

export interface PurchaseSharePayload {
  purchaseId: string;
  purchaseNumber: string;
  supplierName: string;
  supplierPhone: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  formattedMessage: string;
  publicShareToken?: string;
  publicShareUrl?: string;
}

// In-memory token store for secure document sharing with expiration
const tokenStore = new Map<
  string,
  { companyId: string; purchaseId: string; expiresAt: number }
>();

export async function preparePurchaseWhatsAppShare(
  companyId: string,
  purchaseId: string,
  userId: string,
  baseUrl?: string
): Promise<PurchaseSharePayload> {
  const db = prisma as any;

  const purchase = await db.purchase.findFirst({
    where: { id: purchaseId, companyId },
    include: {
      supplier: true,
      goodsReceipts: { select: { grnNumber: true }, take: 1 },
    },
  });

  if (!purchase) {
    throw new NotFoundError('Purchase record not found');
  }

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  });

  // Generate secure share token (valid for 7 days)
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  tokenStore.set(token, { companyId, purchaseId, expiresAt });

  const appBase = baseUrl || 'http://localhost:3000';
  const publicShareUrl = `${appBase}/api/v1/purchases/shared/${token}`;

  const supplierName = purchase.supplier?.name || 'Valued Supplier';
  const supplierPhone = purchase.supplier?.phone || '';
  const grnRef = purchase.goodsReceipts?.[0]?.grnNumber || '-';

  const formattedDate = new Date(purchase.purchaseDate || purchase.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formattedMessage = `Hello ${supplierName},

Please find the Purchase Bill details below:

*Purchase Bill No:* ${purchase.purchaseNumber}
*Date:* ${formattedDate}
*PO Reference:* ${purchase.referenceNumber || purchase.purchaseNumber}
*GRN Reference:* ${grnRef}

*Total Bill Amount:* ₹${purchase.totalAmount.toLocaleString('en-IN')}
*Paid Amount:* ₹${purchase.paidAmount.toLocaleString('en-IN')}
*Outstanding Due:* ₹${purchase.dueAmount.toLocaleString('en-IN')}
*Status:* ${purchase.paymentStatus}

Please find the official document attached/shared separately.

Thank you,
${company?.name || 'FurnitureOS / WoodFlow'}`;

  await createAuditLog({
    userId,
    companyId,
    action: 'PURCHASE_BILL_SHARED_WHATSAPP',
    entity: 'Purchase',
    entityId: purchaseId,
    metadata: { purchaseNumber: purchase.purchaseNumber, supplierName },
  });

  return {
    purchaseId: purchase.id,
    purchaseNumber: purchase.purchaseNumber,
    supplierName,
    supplierPhone,
    totalAmount: purchase.totalAmount,
    paidAmount: purchase.paidAmount,
    dueAmount: purchase.dueAmount,
    paymentStatus: purchase.paymentStatus,
    formattedMessage,
    publicShareToken: token,
    publicShareUrl,
  };
}

export function resolvePublicShareToken(token: string) {
  const record = tokenStore.get(token);
  if (!record) {
    throw new NotFoundError('Shared document link expired or invalid');
  }

  if (Date.now() > record.expiresAt) {
    tokenStore.delete(token);
    throw new NotFoundError('Shared document link expired');
  }

  return record;
}
