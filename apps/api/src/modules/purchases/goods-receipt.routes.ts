import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { requirePermission } from '../../middleware/rbac.js';
import { createGRNHandler, listGRNsHandler } from './goods-receipt.controller.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.post('/', requirePermission('purchases:create'), createGRNHandler);
router.get('/', requirePermission('purchases:read'), listGRNsHandler);

export default router;
