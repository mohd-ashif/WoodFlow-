import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import accessRequestRoutes from '../modules/accessRequest/accessRequest.routes.js';
import companyRoutes from '../modules/company/company.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/access-requests', accessRequestRoutes);
router.use('/company', companyRoutes);
router.use('/admin', adminRoutes);

export default router;
