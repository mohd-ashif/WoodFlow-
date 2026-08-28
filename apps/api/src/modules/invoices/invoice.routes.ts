import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { requirePermission } from '../../middleware/rbac.js';
import { listInvoicesController, getInvoiceController } from './invoice.controller.js';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

router.get('/', requirePermission('sales.view'), listInvoicesController);
router.get('/:id', requirePermission('sales.view'), getInvoiceController);

export default router;
