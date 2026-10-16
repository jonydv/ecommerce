import type { ConfigService } from '@nestjs/config';
import type { Env } from './env.schema.js';

// E2-05 · a page of the front, as an absolute URL: where the API sends the browser back (after Google).
// The ONE place that knows which variable holds the front's origin (E10 turns it into a list: only this file changes).
export function frontUrl(
  config: ConfigService<Env, true>,
  path: string,
): string {
  return new URL(path, config.get('FRONTEND_ORIGIN', { infer: true })).href;
}
