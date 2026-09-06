import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { requirePermission } from '../../middleware/rbac.js';
import {
  listInvoicesController,
  getInvoiceController,
  exportInvoicesController,
  getPublicInvoiceController,
  prepareWhatsAppShareController,
} from './invoice.controller.js';

const router = Router();

// Unauthenticated public route for customer invoice sharing
router.get('/public/:token', getPublicInvoiceController);

// Authenticated tenant routes
router.use(authenticate);
router.use(tenantContext);

router.get('/export', requirePermission('sales.view'), exportInvoicesController);
router.get('/', requirePermission('sales.view'), listInvoicesController);
router.get('/:id', requirePermission('sales.view'), getInvoiceController);
router.post('/:id/share/whatsapp', requirePermission('sales.view'), prepareWhatsAppShareController);

export default router;
