import { STATUS_CODES } from 'node:http';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '../generated/prisma/client.js';

export type ApiError = {
  statusCode: number; error: string; message: string; path: string; requestId: string; timestamp: string;
};

@Catch() // without arguments: catches EVERYTHING, not just HttpException 
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const req = host.switchToHttp().getRequest<Request>();
    const res = host.switchToHttp().getResponse<Response>();
    const requestId = String(req.headers['x-request-id'] ?? 'unknown');
    const { statusCode, message } = toHttp(exception);
    if (statusCode >= 500) {
      this.logger.error(`${req.method} ${req.originalUrl} → ${statusCode} [${requestId}]`,
        exception instanceof Error ? exception.stack : String(exception)); // the detail, to the LOG
    } else {
      this.logger.warn(`${req.method} ${req.originalUrl} → ${statusCode} [${requestId}] ${message}`);
    }
    const error = STATUS_CODES[statusCode] ?? 'Error';
    const body: ApiError = { statusCode, error, message, path: req.originalUrl, requestId, timestamp: new Date().toISOString() };
    res.status(statusCode).json(body);
  }
}

function toHttp(exception: unknown): { statusCode: number; message: string } {
  if (exception instanceof HttpException) {
    const body = exception.getResponse();
    const raw = typeof body === 'string' ? body : (body as { message?: string | string[] }).message;
    const message = Array.isArray(raw) ? raw.join('; ') : (raw ?? exception.message);
    return { statusCode: exception.getStatus(), message };
  }
  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    if (exception.code === 'P2002') return { statusCode: 409, message: 'A record with that value already exists' };
    if (exception.code === 'P2025') return { statusCode: 404, message: 'Record not found' };
  }
  // ❌ old draft: message: exception.message   ✅ now: nothing from the original 
  return { statusCode: 500, message: 'Internal server error' };
}