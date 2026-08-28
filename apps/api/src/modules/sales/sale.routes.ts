import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { requirePermission } from '../../middleware/rbac.js';
import {
  createSale,
  confirmSaleController,
  cancelSaleController,
  listSalesController,
  getSaleController,
} from './sale.controller.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.get('/', requirePermission('sales.view'), listSalesController);
router.post('/', requirePermission('sales.create'), createSale);
router.get('/:id', requirePermission('sales.view'), getSaleController);
router.post('/:id/confirm', requirePermission('sales.create'), confirmSaleController);
router.post('/:id/cancel', requirePermission('sales.cancel'), cancelSaleController);

export default router;
