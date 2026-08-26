import { Router } from 'express';
import * as controller from './company.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { requireRoles } from '../../middleware/rbac.js';
import { CompanyRole } from '@prisma/client';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/', controller.getMyCompany);
router.patch('/', requireRoles([CompanyRole.OWNER]), controller.updateMyCompany);

router.get('/members', controller.getMembers);
router.patch('/members/:id/role', requireRoles([CompanyRole.OWNER]), controller.updateRole);
router.patch('/members/:id/status', requireRoles([CompanyRole.OWNER]), controller.updateStatus);

export default router;
