import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const logger = new Logger('HTTP');
const SAFE_ID = /^[\w-]{1,64}$/; // an unknown id doesn't throw garbage into logs
export function requestId(req: Request, res: Response, next: NextFunction) {
  const incoming = req.headers['x-request-id'];
  const id = typeof incoming === 'string' && SAFE_ID.test(incoming) ? incoming : randomUUID();
  req.headers['x-request-id'] = id; // the filter reads it
  res.setHeader('x-request-id', id); // goes back to the client, also in a 200
  const start = performance.now();
  res.on('finish', () => logger.log('request completed', {
    method: req.method, path: req.originalUrl, status: res.statusCode,
    ms: Math.round(performance.now() - start), requestId: id,
  }));
  next();
}