import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/errors.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const Busboy = require('busboy');

export interface UploadedFile {
  name: string;
  data: Buffer;
  size: number;
  mimetype: string;
}

export function parseMultipart(maxSizeMb = 10) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return next(new BadRequestError('Content-Type must be multipart/form-data'));
    }

    const MAX_SIZE = maxSizeMb * 1024 * 1024;
    let fileReceived = false;
    let sizeLimitExceeded = false;

    try {
      const bb = Busboy({ headers: req.headers, limits: { fileSize: MAX_SIZE } });
      req.body = {};

      bb.on('field', (fieldname: string, val: string) => {
        req.body[fieldname] = val;
      });

      bb.on('file', (fieldname: string, stream: any, info: any) => {
        fileReceived = true;
        const { filename, mimeType } = info;
        const chunks: Buffer[] = [];

        stream.on('data', (chunk: Buffer) => chunks.push(chunk));
        stream.on('limit', () => {
          sizeLimitExceeded = true;
          stream.resume();
          next(new BadRequestError(`File size exceeds the ${maxSizeMb}MB limit`));
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
          return next(new BadRequestError('No file provided. Please attach a file to upload.'));
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
  };
}
