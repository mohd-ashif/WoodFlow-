import { Router } from 'express';
import * as controller from './company.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { requireRoles } from '../../middleware/rbac.js';
import { parseMultipart } from '../../middleware/multipart.js';
import { CompanyRole } from '@prisma/client';

const router = Router();

router.use(authenticate, tenantContext);

// Company Details & Profile
router.get('/', controller.getMyCompany);
router.patch('/', requireRoles([CompanyRole.OWNER]), controller.updateMyCompany);
router.get('/profile', controller.getCompanyProfile);
router.put('/profile', requireRoles([CompanyRole.OWNER]), controller.updateCompanyProfile);

// Branding Configuration
router.get('/branding', controller.getBranding);
router.put('/branding', requireRoles([CompanyRole.OWNER]), controller.updateBranding);

// Company Logo
router.post('/logo', requireRoles([CompanyRole.OWNER]), parseMultipart(5), controller.uploadCompanyLogo);
router.delete('/logo', requireRoles([CompanyRole.OWNER]), controller.removeCompanyLogo);

// Invoice Logo
router.post('/invoice-logo', requireRoles([CompanyRole.OWNER]), parseMultipart(5), controller.uploadInvoiceLogo);
router.delete('/invoice-logo', requireRoles([CompanyRole.OWNER]), controller.removeInvoiceLogo);

// Team Members
router.get('/members', controller.getMembers);
router.post('/members', requireRoles([CompanyRole.OWNER]), controller.createMember);
router.patch('/members/:id/role', requireRoles([CompanyRole.OWNER]), controller.updateRole);
router.patch('/members/:id/status', requireRoles([CompanyRole.OWNER]), controller.updateStatus);

export default router;
