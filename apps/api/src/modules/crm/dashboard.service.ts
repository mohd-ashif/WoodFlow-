import { prisma } from '../../config/prisma.js';

export async function getCRMDashboardStats(companyId: string) {
  const db = prisma as any;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const customerModel = db.customer;
  const supplierModel = db.supplier;
  const crmActivityModel = db.crmActivity || db.cRMActivity;

  const [
    totalCustomers,
    activeCustomers,
    totalSuppliers,
    activeSuppliers,
    newCustomersThisMonth,
    newSuppliersThisMonth,
    recentCustomers,
    recentSuppliers,
    recentActivities,
  ] = await Promise.all([
    customerModel ? customerModel.count({ where: { companyId } }) : 0,
    customerModel ? customerModel.count({ where: { companyId, status: 'ACTIVE' } }) : 0,
    supplierModel ? supplierModel.count({ where: { companyId } }) : 0,
    supplierModel ? supplierModel.count({ where: { companyId, status: 'ACTIVE' } }) : 0,
    customerModel
      ? customerModel.count({
          where: {
            companyId,
            createdAt: { gte: startOfMonth },
          },
        })
      : 0,
    supplierModel
      ? supplierModel.count({
          where: {
            companyId,
            createdAt: { gte: startOfMonth },
          },
        })
      : 0,
    customerModel
      ? customerModel.findMany({
          where: { companyId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            customerCode: true,
            name: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        })
      : [],
    supplierModel
      ? supplierModel.findMany({
          where: { companyId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            supplierCode: true,
            name: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        })
      : [],
    crmActivityModel
      ? crmActivityModel.findMany({
          where: { companyId },
          orderBy: { createdAt: 'desc' },
          take: 8,
          include: {
            creator: {
              select: { name: true },
            },
          },
        })
      : [],
  ]);

  return {
    stats: {
      totalCustomers,
      activeCustomers,
      totalSuppliers,
      activeSuppliers,
      newCustomersThisMonth,
      newSuppliersThisMonth,
    },
    recentCustomers,
    recentSuppliers,
    recentActivities,
  };
}
