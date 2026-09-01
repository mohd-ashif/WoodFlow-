import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { getNotifications, markAsRead, markAllAsRead } from './notification.controller.js';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);

export default router;
