import { Router } from 'express';
import * as controller from './supplier.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/check-duplicate', requirePermission('suppliers.view'), controller.checkDuplicate);
router.get('/export', requirePermission('suppliers.export'), controller.exportSuppliers);

router.get('/', requirePermission('suppliers.view'), controller.getSuppliers);
router.post('/', requirePermission('suppliers.create'), controller.createSupplier);
router.get('/:id', requirePermission('suppliers.view'), controller.getSupplierById);
router.patch('/:id', requirePermission('suppliers.update'), controller.updateSupplier);
router.post('/:id/archive', requirePermission('suppliers.archive'), controller.archiveSupplier);
router.post('/:id/restore', requirePermission('suppliers.archive'), controller.restoreSupplier);

// Addresses
router.post('/:id/addresses', requirePermission('suppliers.update'), controller.addAddress);
router.patch('/:id/addresses/:addressId', requirePermission('suppliers.update'), controller.updateAddress);
router.delete('/:id/addresses/:addressId', requirePermission('suppliers.update'), controller.deleteAddress);

// Notes
router.post('/:id/notes', requirePermission('suppliers.update'), controller.addNote);
router.delete('/:id/notes/:noteId', requirePermission('suppliers.update'), controller.deleteNote);

// Activities
router.get('/:id/activities', requirePermission('suppliers.view'), controller.getSupplierActivities);

export default router;
