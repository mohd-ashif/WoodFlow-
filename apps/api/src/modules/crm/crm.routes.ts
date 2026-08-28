import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { requirePermission } from '../../middleware/rbac.js';
import * as activityController from './activity.controller.js';
import * as tagController from './tag.controller.js';
import * as dashboardController from './dashboard.controller.js';

const router = Router();

router.use(authenticate, tenantContext);

// Dashboard
router.get('/dashboard', requirePermission('crm.dashboard.view'), dashboardController.getDashboard);

// Activities
router.get('/activities', requirePermission('crm.activity.view'), activityController.listActivities);
router.post('/activities', requirePermission('crm.activity.create'), activityController.createActivity);

// Tags
router.get('/tags', tagController.getTags);
router.post('/tags', requirePermission('customers.manage_tags'), tagController.createTag);
router.patch('/tags/:id', requirePermission('customers.manage_tags'), tagController.updateTag);
router.post('/tags/:id/deactivate', requirePermission('customers.manage_tags'), tagController.deactivateTag);

export default router;
