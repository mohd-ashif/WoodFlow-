import { Router } from 'express';
import * as controller from './accessRequest.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', controller.submitRequest);
router.get('/me', controller.getMyRequests);

export default router;
