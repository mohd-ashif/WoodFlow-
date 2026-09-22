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
  getPurchasePdfHandler,
  sharePurchaseWhatsAppHandler,
  getPublicPurchasePdfHandler,
} from './purchase.controller.js';

const router = Router();

// Public shared document route (Unauthenticated with token validation)
router.get('/shared/:token', getPublicPurchasePdfHandler);

// Protected tenant routes
router.use(authenticate);
router.use(tenantContext);

router.get('/overview', requirePermission('purchases.view'), getPurchasesOverviewController);
router.get('/', requirePermission('purchases.view'), listPurchasesController);
router.post('/', requirePermission('purchases.create'), createPurchase);
router.get('/:id', requirePermission('purchases.view'), getPurchaseController);
router.get('/:id/pdf', requirePermission('purchases.view'), getPurchasePdfHandler);
router.get('/:id/pdf/preview', requirePermission('purchases.view'), getPurchasePdfHandler);
router.post('/:id/share/whatsapp', requirePermission('purchases.view'), sharePurchaseWhatsAppHandler);
router.post('/:id/confirm', requirePermission('purchases.create'), confirmPurchaseController);
router.post('/:id/cancel', requirePermission('purchases.cancel'), cancelPurchaseController);

export default router;
