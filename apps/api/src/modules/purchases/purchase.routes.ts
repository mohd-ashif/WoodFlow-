import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { requirePermission } from '../../middleware/rbac.js';
import {
  createPurchase,
  confirmPurchaseController,
  cancelPurchaseController,
  listPurchasesController,
  getPurchaseController,
  getPurchasesOverviewController,
} from './purchase.controller.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.get('/overview', requirePermission('purchases.view'), getPurchasesOverviewController);
router.get('/', requirePermission('purchases.view'), listPurchasesController);
router.post('/', requirePermission('purchases.create'), createPurchase);
router.get('/:id', requirePermission('purchases.view'), getPurchaseController);
router.post('/:id/confirm', requirePermission('purchases.create'), confirmPurchaseController);
router.post('/:id/cancel', requirePermission('purchases.cancel'), cancelPurchaseController);

export default router;
