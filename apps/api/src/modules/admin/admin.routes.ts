import { Router } from 'express';
import * as controller from './admin.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requirePlatformAdmin } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, requirePlatformAdmin);

router.get('/stats', controller.getStats);

// Companies management
router.get('/companies', controller.listCompanies);
router.post('/companies', controller.createCompany);
router.get('/companies/:id', controller.getCompany);
router.patch('/companies/:id', controller.updateCompany);
router.post('/companies/:id/suspend', controller.suspendCompany);
router.post('/companies/:id/activate', controller.activateCompany);

// Access requests management
router.get('/access-requests', controller.listAccessRequests);
router.get('/access-requests/:id', controller.getAccessRequest);
router.post('/access-requests/:id/approve', controller.approveAccessRequest);
router.post('/access-requests/:id/reject', controller.rejectAccessRequest);

// Users management
router.get('/users', controller.listUsers);
router.get('/users/:id', controller.getUserDetails);
router.patch('/users/:id/status', controller.updateUserStatus);
router.post('/users/:id/assign-company', controller.assignUserCompany);
router.delete('/users/:id/company/:companyId', controller.removeUserCompany);

// System activity logs
router.get('/activity', controller.listActivity);

export default router;
