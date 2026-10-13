import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ controllers: [HealthController] }).compile();
    controller = moduleRef.get(HealthController);
  });

  it('answers ok with a numeric uptime and an ISO timestamp', () => {
    const res = controller.check();
    expect(res.status).toBe('ok');
    expect(typeof res.uptime).toBe('number');
    expect(new Date(res.timestamp).toISOString()).toBe(res.timestamp);
  });
});