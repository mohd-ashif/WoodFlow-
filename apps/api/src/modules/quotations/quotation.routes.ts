import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { requirePermission } from '../../middleware/rbac.js';
import {
  createQuotationHandler,
  listQuotationsHandler,
  getQuotationByIdHandler,
  convertQuotationHandler,
} from './quotation.controller.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.post('/', requirePermission('sales:create'), createQuotationHandler);
router.get('/', requirePermission('sales:read'), listQuotationsHandler);
router.get('/:id', requirePermission('sales:read'), getQuotationByIdHandler);
router.post('/:id/convert', requirePermission('sales:create'), convertQuotationHandler);

export default router;
