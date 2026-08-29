import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import accessRequestRoutes from '../modules/accessRequest/accessRequest.routes.js';
import companyRoutes from '../modules/company/company.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import productRoutes from '../modules/product/product.routes.js';
import categoryRoutes from '../modules/category/category.routes.js';
import unitRoutes from '../modules/unit/unit.routes.js';
import inventoryRoutes from '../modules/inventory/inventory.routes.js';
import uploadRoutes from '../modules/upload/upload.routes.js';
import customerRoutes from '../modules/customers/customer.routes.js';
import supplierRoutes from '../modules/suppliers/supplier.routes.js';
import crmRoutes from '../modules/crm/crm.routes.js';
import saleRoutes from '../modules/sales/sale.routes.js';
import invoiceRoutes from '../modules/invoices/invoice.routes.js';
import purchaseRoutes from '../modules/purchases/purchase.routes.js';
import workerRoutes from '../modules/workers/worker.routes.js';
import workOrderRoutes from '../modules/workOrders/workOrder.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/access-requests', accessRequestRoutes);
router.use('/company', companyRoutes);
router.use('/admin', adminRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/units', unitRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/upload', uploadRoutes);
router.use('/customers', customerRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/crm', crmRoutes);
router.use('/sales', saleRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/workers', workerRoutes);
router.use('/work-orders', workOrderRoutes);

export default router;


