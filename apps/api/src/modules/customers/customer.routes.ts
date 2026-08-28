import { Router } from 'express';
import * as controller from './customer.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/check-duplicate', requirePermission('customers.view'), controller.checkDuplicate);
router.get('/export', requirePermission('customers.export'), controller.exportCustomers);

router.get('/', requirePermission('customers.view'), controller.getCustomers);
router.post('/', requirePermission('customers.create'), controller.createCustomer);
router.get('/:id', requirePermission('customers.view'), controller.getCustomerById);
router.patch('/:id', requirePermission('customers.update'), controller.updateCustomer);
router.post('/:id/archive', requirePermission('customers.archive'), controller.archiveCustomer);
router.post('/:id/restore', requirePermission('customers.archive'), controller.restoreCustomer);

// Addresses
router.post('/:id/addresses', requirePermission('customers.update'), controller.addAddress);
router.patch('/:id/addresses/:addressId', requirePermission('customers.update'), controller.updateAddress);
router.delete('/:id/addresses/:addressId', requirePermission('customers.update'), controller.deleteAddress);

// Notes
router.post('/:id/notes', requirePermission('customers.update'), controller.addNote);
router.delete('/:id/notes/:noteId', requirePermission('customers.update'), controller.deleteNote);

// Activities
router.get('/:id/activities', requirePermission('customers.view'), controller.getCustomerActivities);

export default router;
