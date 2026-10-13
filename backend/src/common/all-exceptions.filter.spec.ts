import { NotFoundException, type ArgumentsHost } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

function run(exception: unknown) {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const req = { method: 'GET', originalUrl: '/x', headers: { 'x-request-id': 'req-1' } };
  const host = { switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }) } as unknown as ArgumentsHost;
  new AllExceptionsFilter().catch(exception, host);
  return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
}
const prismaError = (code: string) => new Prisma.PrismaClientKnownRequestError('internal detail', { code, clientVersion: '7.10.0' });

describe('AllExceptionsFilter', () => {
  it('P2002 → 409', () => expect(run(prismaError('P2002')).body).toMatchObject({ statusCode: 409, error: 'Conflict', requestId: 'req-1' }));
  it('P2025 → 404', () => expect(run(prismaError('P2025')).status).toBe(404));
  it('HttpException keeps its message', () => expect(run(new NotFoundException('nope')).body.message).toBe('nope'));
  it('500 never leaks the original message', () => {
    const { status, body } = run(new Error('password authentication failed for user "ecommerce"'));
    expect(status).toBe(500);
    expect(JSON.stringify(body)).not.toContain('password');
  });
});