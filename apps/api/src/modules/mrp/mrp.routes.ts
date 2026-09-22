import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { requirePermission } from '../../middleware/rbac.js';
import {
  runMRPHandler,
  getMaterialRequirementsHandler,
  reserveStockHandler,
  releaseReservationHandler,
} from './mrp.controller.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.post('/run', requirePermission('mrp:execute'), runMRPHandler);
router.get('/requirements', requirePermission('mrp:read'), getMaterialRequirementsHandler);
router.post('/reserve', requirePermission('inventory:update'), reserveStockHandler);
router.post('/reservations/:id/release', requirePermission('inventory:update'), releaseReservationHandler);

export default router;
