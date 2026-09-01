import { Router } from 'express';
import * as controller from './controllers/import.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';

const router = Router();

router.use(authenticate, tenantContext);

router.post('/upload', controller.uploadAndPreview);
router.post('/confirm', controller.confirmImport);
router.get('/template/:module', controller.downloadTemplate);
router.get('/history', controller.getImportHistory);
router.get('/:id', controller.getJobDetails);
router.get('/:id/errors', controller.downloadErrorReport);

export default router;
