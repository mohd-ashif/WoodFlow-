import { Router } from 'express';
import * as controller from './unit.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/', controller.getUnits);
router.post('/', controller.createUnit);
router.patch('/:id', controller.updateUnit);
router.post('/:id/deactivate', controller.deactivateUnit);

export default router;
