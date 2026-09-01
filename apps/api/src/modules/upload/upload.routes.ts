import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { tenantContext } from '../../middleware/tenantContext.js';
import * as controller from './upload.controller.js';
import { BadRequestError } from '../../utils/errors.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const Busboy = require('busboy');

const router = Router();
router.use(authenticate, tenantContext);

/**
 * Multipart parser middleware handling single or multiple fields
 */
function parseMultipart(req: Request, _res: Response, next: NextFunction) {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return next(new BadRequestError('Content-Type must be multipart/form-data'));
  }

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  let fileReceived = false;
  let sizeLimitExceeded = false;

  try {
    const bb = Busboy({ headers: req.headers, limits: { fileSize: MAX_SIZE } });
    req.body = {};

    bb.on('field', (fieldname: string, val: string) => {
      req.body[fieldname] = val;
    });

    bb.on('file', (fieldname: string, stream: any, info: any) => {
      if (fieldname !== 'image' && fieldname !== 'file' && fieldname !== 'fileBuffer') {
        stream.resume();
        return;
      }

      fileReceived = true;
      const { filename, mimeType } = info;
      const chunks: Buffer[] = [];

      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('limit', () => {
        sizeLimitExceeded = true;
        stream.resume();
        next(new BadRequestError('File size exceeds the 5MB limit'));
      });
      stream.on('end', () => {
        if (!sizeLimitExceeded) {
          const data = Buffer.concat(chunks);
          (req as any).uploadedFile = {
            name: filename,
            data,
            size: data.length,
            mimetype: mimeType,
          };
        }
      });
    });

    bb.on('finish', () => {
      if (sizeLimitExceeded) return;
      if (!fileReceived) {
        return next(new BadRequestError('No image file provided. Include a file field named "image" or "file".'));
      }
      next();
    });

    bb.on('error', (err: Error) => {
      next(new BadRequestError(`File upload error: ${err.message}`));
    });

    req.pipe(bb);
  } catch (err: any) {
    next(new BadRequestError(`Failed to parse upload: ${err.message}`));
  }
}

router.post('/', parseMultipart, controller.uploadSingleImage);
router.post('/image', parseMultipart, controller.uploadSingleImage);
router.delete('/image/:imageId', controller.deleteImage);
router.patch('/image/:imageId/primary', controller.setPrimaryImage);
router.get('/entity/:entityType/:entityId', controller.getEntityImages);

export default router;
