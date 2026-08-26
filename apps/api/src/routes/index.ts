import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import accessRequestRoutes from '../modules/accessRequest/accessRequest.routes.js';
import companyRoutes from '../modules/company/company.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import productRoutes from '../modules/product/product.routes.js';
import categoryRoutes from '../modules/category/category.routes.js';
import unitRoutes from '../modules/unit/unit.routes.js';
import inventoryRoutes from '../modules/inventory/inventory.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/access-requests', accessRequestRoutes);
router.use('/company', companyRoutes);
router.use('/admin', adminRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/units', unitRoutes);
router.use('/inventory', inventoryRoutes);

export default router;

