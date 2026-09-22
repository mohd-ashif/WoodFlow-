import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { requirePermission } from '../../middleware/rbac.js';
import { createPRHandler, listPRsHandler, convertPRHandler } from './purchase-request.controller.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.post('/', requirePermission('purchases:create'), createPRHandler);
router.get('/', requirePermission('purchases:read'), listPRsHandler);
router.post('/:id/convert', requirePermission('purchases:create'), convertPRHandler);

export default router;
