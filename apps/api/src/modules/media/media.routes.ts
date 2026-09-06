import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import { parseMultipart } from '../../middleware/multipart.js';
import * as controller from './media.controller.js';

const router = Router();
router.use(authenticate, tenantContext);

router.post('/upload-signature', controller.getUploadSignature);
router.post('/finalize', controller.finalizeUpload);
router.post('/upload', parseMultipart(5), controller.uploadImageProxy);
router.get('/entity/:entityType/:entityId', controller.getEntityImages);
router.patch('/:id/primary', controller.setPrimaryImage);
router.delete('/:id', controller.deleteImage);
router.post('/cleanup-orphans', controller.cleanupOrphans);

export default router;
