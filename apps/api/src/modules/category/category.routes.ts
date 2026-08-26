import { Router } from 'express';
import * as controller from './category.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/', controller.getCategories);
router.post('/', controller.createCategory);
router.patch('/:id', controller.updateCategory);
router.post('/:id/deactivate', controller.deactivateCategory);

export default router;
