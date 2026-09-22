import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../utils/errors.js';

export interface TimelineNode {
  id: string;
  type:
    | 'CUSTOMER'
    | 'CUSTOMER_DESIGN'
    | 'QUOTATION'
    | 'SALES_ORDER'
    | 'DEMAND'
    | 'MRP'
    | 'PURCHASE_REQUEST'
    | 'PURCHASE_ORDER'
    | 'GOODS_RECEIPT'
    | 'WORK_ORDER'
    | 'MATERIAL_ISSUE'
    | 'PRODUCTION_OUTPUT'
    | 'QUALITY_CHECK'
    | 'DELIVERY'
    | 'INVOICE'
    | 'PAYMENT';
  title: string;
  subtitle?: string;
  status: string;
  timestamp: string;
  details?: any;
  link?: string;
}

export async function getDocumentTimeline(companyId: string, entityType: string, entityId: string): Promise<TimelineNode[]> {
  const db = prisma as any;
  const nodes: TimelineNode[] = [];

  let salesOrderId: string | null = null;
  let workOrderId: string | null = null;
  let purchaseId: string | null = null;
  let customerId: string | null = null;

  // Resolve root links based on input entity
  if (entityType === 'sales-order' || entityType === 'Sale') {
    salesOrderId = entityId;
  } else if (entityType === 'work-order' || entityType === 'WorkOrder') {
    workOrderId = entityId;
    const wo = await db.workOrder.findFirst({ where: { id: entityId, companyId } });
    if (wo) {
      salesOrderId = wo.salesOrderId;
      customerId = wo.customerId;
    }
  } else if (entityType === 'purchase' || entityType === 'Purchase') {
    purchaseId = entityId;
    const po = await db.purchase.findFirst({ where: { id: entityId, companyId } });
    if (po) {
      salesOrderId = po.salesOrderId;
      workOrderId = po.workOrderId;
    }
  }

  // 1. Customer
  if (salesOrderId) {
    const sale = await db.sale.findFirst({
      where: { id: salesOrderId, companyId },
      include: {
        customer: true,
        quotation: { include: { design: true } },
        demands: true,
        invoices: true,
        customerPayments: true,
        deliveries: { include: { items: true } },
        workOrders: {
          include: {
            materials: { include: { product: true } },
            qualityChecks: true,
            outputs: true,
          },
        },
        purchases: {
          include: {
            goodsReceipts: true,
          },
        },
      },
    });

    if (sale) {
      // Customer
      if (sale.customer) {
        nodes.push({
          id: sale.customer.id,
          type: 'CUSTOMER',
          title: `Customer: ${sale.customer.name}`,
          subtitle: `Code: ${sale.customer.customerCode} | Phone: ${sale.customer.phone}`,
          status: sale.customer.status,
          timestamp: sale.customer.createdAt.toISOString(),
          link: `/crm/customers/${sale.customer.id}`,
        });
      }

      // Customer Design
      if (sale.quotation?.design) {
        nodes.push({
          id: sale.quotation.design.id,
          type: 'CUSTOMER_DESIGN',
          title: `Custom Design #${sale.quotation.design.designNumber}`,
          subtitle: sale.quotation.design.name,
          status: sale.quotation.design.status,
          timestamp: sale.quotation.design.createdAt.toISOString(),
          link: `/crm/designs/${sale.quotation.design.id}`,
        });
      }

      // Quotation
      if (sale.quotation) {
        nodes.push({
          id: sale.quotation.id,
          type: 'QUOTATION',
          title: `Quotation #${sale.quotation.quotationNumber}`,
          subtitle: `Total: ₹${sale.quotation.totalAmount.toLocaleString('en-IN')}`,
          status: sale.quotation.status,
          timestamp: sale.quotation.createdAt.toISOString(),
          link: `/sales/quotations`,
        });
      }

      // Sales Order
      nodes.push({
        id: sale.id,
        type: 'SALES_ORDER',
        title: `Sales Order #${sale.saleNumber}`,
        subtitle: `Total Amount: ₹${sale.totalAmount.toLocaleString('en-IN')}`,
        status: sale.status,
        timestamp: sale.createdAt.toISOString(),
        link: `/sales/${sale.id}`,
      });

      // Sales Demand
      if (sale.demands && sale.demands.length > 0) {
        nodes.push({
          id: sale.demands[0].id,
          type: 'DEMAND',
          title: `Demand Generated (${sale.demands.length} items)`,
          status: sale.demands[0].status,
          timestamp: sale.demands[0].createdAt.toISOString(),
          link: `/mrp`,
        });
      }

      // Work Orders & Production
      for (const wo of sale.workOrders) {
        nodes.push({
          id: wo.id,
          type: 'WORK_ORDER',
          title: `Work Order #${wo.workOrderNumber}`,
          subtitle: wo.title,
          status: wo.status,
          timestamp: wo.createdAt.toISOString(),
          link: `/work-orders/${wo.id}`,
        });

        // Material Issue
        const issuedCount = wo.materials.filter((m: any) => m.issuedQuantity > 0).length;
        if (issuedCount > 0) {
          nodes.push({
            id: `mat-${wo.id}`,
            type: 'MATERIAL_ISSUE',
            title: `Materials Issued (${issuedCount} materials)`,
            status: 'ISSUED',
            timestamp: wo.updatedAt.toISOString(),
          });
        }

        // Quality Check
        for (const qc of wo.qualityChecks) {
          nodes.push({
            id: qc.id,
            type: 'QUALITY_CHECK',
            title: `Quality Inspection`,
            subtitle: qc.notes || undefined,
            status: qc.status,
            timestamp: qc.createdAt.toISOString(),
          });
        }

        // Production Output
        for (const out of wo.outputs) {
          nodes.push({
            id: out.id,
            type: 'PRODUCTION_OUTPUT',
            title: `Finished Goods Produced (Qty: ${out.quantity})`,
            status: 'COMPLETED',
            timestamp: out.createdAt.toISOString(),
          });
        }
      }

      // Purchases & Goods Receipts
      for (const po of sale.purchases) {
        nodes.push({
          id: po.id,
          type: 'PURCHASE_ORDER',
          title: `Purchase Order #${po.purchaseNumber}`,
          subtitle: `Amount: ₹${po.totalAmount.toLocaleString('en-IN')}`,
          status: po.status,
          timestamp: po.createdAt.toISOString(),
          link: `/purchases/${po.id}`,
        });

        for (const grn of po.goodsReceipts) {
          nodes.push({
            id: grn.id,
            type: 'GOODS_RECEIPT',
            title: `Goods Receipt #${grn.grnNumber}`,
            status: grn.status,
            timestamp: grn.createdAt.toISOString(),
          });
        }
      }

      // Deliveries
      for (const del of sale.deliveries) {
        nodes.push({
          id: del.id,
          type: 'DELIVERY',
          title: `Sales Delivery #${del.deliveryNumber}`,
          subtitle: del.trackingNumber ? `Tracking: ${del.trackingNumber}` : undefined,
          status: del.status,
          timestamp: del.createdAt.toISOString(),
        });
      }

      // Invoices
      for (const inv of sale.invoices) {
        nodes.push({
          id: inv.id,
          type: 'INVOICE',
          title: `Invoice #${inv.invoiceNumber}`,
          subtitle: `Amount: ₹${inv.totalAmount.toLocaleString('en-IN')}`,
          status: inv.status,
          timestamp: inv.createdAt.toISOString(),
          link: `/invoices/${inv.id}`,
        });
      }

      // Customer Payments
      for (const pay of sale.customerPayments) {
        nodes.push({
          id: pay.id,
          type: 'PAYMENT',
          title: `Customer Payment Received: ₹${pay.amount.toLocaleString('en-IN')}`,
          subtitle: `Method: ${pay.paymentMethod}`,
          status: 'PAID',
          timestamp: pay.createdAt.toISOString(),
        });
      }
    }
  }

  // Sort nodes chronologically
  nodes.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return nodes;
}
