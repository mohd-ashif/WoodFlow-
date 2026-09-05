import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import * as controller from './upload.controller.js';
import { parseMultipart } from '../../middleware/multipart.js';

const router = Router();
router.use(authenticate, tenantContext);

router.post('/', parseMultipart(5), controller.uploadSingleImage);
router.post('/image', parseMultipart(5), controller.uploadSingleImage);
router.delete('/image/:imageId', controller.deleteImage);
router.patch('/image/:imageId/primary', controller.setPrimaryImage);
router.get('/entity/:entityType/:entityId', controller.getEntityImages);

export default router;
