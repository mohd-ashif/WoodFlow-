import { Router } from 'express';
import * as controller from './product.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/', controller.getProducts);
router.post('/', controller.createProduct);
router.get('/:id', controller.getProductById);
router.patch('/:id', controller.updateProduct);
router.post('/:id/deactivate', controller.deactivateProduct);
router.post('/:id/activate', controller.activateProduct);

export default router;
