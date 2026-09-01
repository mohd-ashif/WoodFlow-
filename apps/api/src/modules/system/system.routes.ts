import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { getSystemHealth, checkDataConsistency } from './system.controller.js';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/health', getSystemHealth);
router.get('/data-consistency', checkDataConsistency);

export default router;
