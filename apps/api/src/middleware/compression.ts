import { Request, Response, NextFunction } from 'express';
import zlib from 'zlib';

/**
 * Built-in Node.js Gzip/Deflate HTTP Response Compression Middleware.
 * Automatically compresses response payloads > 1KB when the client sends Accept-Encoding header.
 */
export function httpCompression(req: Request, res: Response, next: NextFunction) {
  const acceptEncoding = req.headers['accept-encoding'] || '';

  if (!acceptEncoding.includes('gzip') && !acceptEncoding.includes('deflate')) {
    return next();
  }

  const originalSend = res.send;

  res.send = function (body: any): Response {
    // Only compress text / JSON responses above 1KB
    if (res.headersSent || !body) {
      return originalSend.call(this, body);
    }

    const contentType = res.getHeader('Content-Type') as string;
    if (contentType && !contentType.includes('json') && !contentType.includes('text')) {
      return originalSend.call(this, body);
    }

    const buffer = Buffer.isBuffer(body)
      ? body
      : typeof body === 'string'
      ? Buffer.from(body)
      : Buffer.from(JSON.stringify(body));

    if (buffer.length < 1024) {
      return originalSend.call(this, body);
    }

    if (acceptEncoding.includes('gzip')) {
      zlib.gzip(buffer, (err, compressed) => {
        if (err) {
          return originalSend.call(this, body);
        }
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Length', compressed.length);
        res.removeHeader('Transfer-Encoding');
        originalSend.call(this, compressed);
      });
      return res;
    } else if (acceptEncoding.includes('deflate')) {
      zlib.deflate(buffer, (err, compressed) => {
        if (err) {
          return originalSend.call(this, body);
        }
        res.setHeader('Content-Encoding', 'deflate');
        res.setHeader('Content-Length', compressed.length);
        res.removeHeader('Transfer-Encoding');
        originalSend.call(this, compressed);
      });
      return res;
    }

    return originalSend.call(this, body);
  };

  next();
}
