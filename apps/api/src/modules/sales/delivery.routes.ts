import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { requirePermission } from '../../middleware/rbac.js';
import {
  createDeliveryHandler,
  listDeliveriesHandler,
  getDeliveryByIdHandler,
  updateDeliveryStatusHandler,
} from './delivery.controller.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.post('/', requirePermission('sales:create'), createDeliveryHandler);
router.get('/', requirePermission('sales:read'), listDeliveriesHandler);
router.get('/:id', requirePermission('sales:read'), getDeliveryByIdHandler);
router.patch('/:id/status', requirePermission('sales:update'), updateDeliveryStatusHandler);

export default router;
