import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { globalSearch } from './search.controller.js';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/', globalSearch);

export default router;
