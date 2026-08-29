import { Router } from 'express';
import * as controller from './workOrder.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, tenantContext);

// Dashboard
router.get('/dashboard/stats', requirePermission('production.view'), controller.getProductionStats);

// Work Orders
router.get('/', requirePermission('work_orders.view'), controller.getWorkOrders);
router.post('/', requirePermission('work_orders.create'), controller.createWorkOrder);
router.get('/:id', requirePermission('work_orders.view'), controller.getWorkOrder);
router.patch('/:id/status', requirePermission('work_orders.update'), controller.updateWorkOrderStatus);

// Production Tasks
router.post('/:id/tasks', requirePermission('production_tasks.create'), controller.createProductionTask);
router.post('/tasks/:taskId/assign', requirePermission('production_tasks.assign'), controller.assignWorkerTask);
router.patch('/tasks/:taskId/status', requirePermission('production_tasks.update'), controller.updateTaskStatus);

// Materials
router.post('/:id/materials/issue', requirePermission('production.material_issue'), controller.issueMaterial);
router.post('/:id/materials/:materialId/return', requirePermission('production.material_return'), controller.returnMaterial);

// Quality Control
router.post('/:id/quality-check', requirePermission('quality.perform'), controller.performQualityCheck);

// Completion
router.post('/:id/complete', requirePermission('production.complete'), controller.completeWorkOrder);

export default router;
