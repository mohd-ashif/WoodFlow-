import { Router } from 'express';
import * as controller from './inventory.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';

import { requirePermission } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/', controller.getInventoryDashboard);
router.get('/reconcile', requirePermission('inventory.view'), controller.reconcileInventory);
router.get('/low-stock', controller.getLowStock);
router.get('/out-of-stock', controller.getOutOfStock);
router.get('/movements', controller.getStockMovements);
router.post('/adjust', controller.adjustStock);
router.get('/:productId', controller.getProductInventory);

export default router;
