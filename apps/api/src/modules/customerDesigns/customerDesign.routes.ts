import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { requirePermission } from '../../middleware/rbac.js';
import {
  createDesignHandler,
  listDesignsHandler,
  getDesignByIdHandler,
  updateDesignHandler,
} from './customerDesign.controller.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.post('/', requirePermission('crm:create'), createDesignHandler);
router.get('/', requirePermission('crm:read'), listDesignsHandler);
router.get('/:id', requirePermission('crm:read'), getDesignByIdHandler);
router.patch('/:id', requirePermission('crm:update'), updateDesignHandler);

export default router;
