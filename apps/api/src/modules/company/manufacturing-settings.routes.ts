import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { requirePermission } from '../../middleware/rbac.js';
import {
  getManufacturingSettingsHandler,
  updateManufacturingSettingsHandler,
} from './manufacturing-settings.controller.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.get('/', getManufacturingSettingsHandler);
router.patch('/', requirePermission('company:update'), updateManufacturingSettingsHandler);

export default router;
