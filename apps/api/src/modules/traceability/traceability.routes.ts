import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { getDocumentTimelineHandler } from './traceability.controller.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.get('/:entityType/:entityId', getDocumentTimelineHandler);

export default router;
