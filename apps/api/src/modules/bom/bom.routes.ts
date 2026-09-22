import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { requirePermission } from '../../middleware/rbac.js';
import {
  createBOMHandler,
  listBOMsHandler,
  getBOMByIdHandler,
  createBOMVersionHandler,
  explodeBOMHandler,
} from './bom.controller.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.post('/', requirePermission('boms:create'), createBOMHandler);
router.get('/', requirePermission('boms:read'), listBOMsHandler);
router.get('/:id', requirePermission('boms:read'), getBOMByIdHandler);
router.post('/version', requirePermission('boms:update'), createBOMVersionHandler);
router.post('/:productId/explode', requirePermission('boms:read'), explodeBOMHandler);

export default router;
