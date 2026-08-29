import { Router } from 'express';
import * as controller from './worker.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { requirePermission } from '../../middleware/rbac.js';

const router = Router();

router.use(authenticate, tenantContext);

// Departments
router.get('/departments', requirePermission('departments.view'), controller.getDepartments);
router.post('/departments', requirePermission('departments.create'), controller.createDepartment);
router.patch('/departments/:id', requirePermission('departments.update'), controller.updateDepartment);

// Workers
router.get('/', requirePermission('workers.view'), controller.getWorkers);
router.post('/', requirePermission('workers.create'), controller.createWorker);
router.get('/:id', requirePermission('workers.view'), controller.getWorker);
router.patch('/:id', requirePermission('workers.update'), controller.updateWorker);

// Attendance
router.post('/attendance', requirePermission('attendance.manage'), controller.recordAttendance);

export default router;
