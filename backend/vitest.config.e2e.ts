import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        'postgresql://ecommerce:ecommerce@localhost:5433/ecommerce_test',
      // E2-05: a fake Google that the test itself starts (test/google-login.e2e-spec.ts). Never the real one
      GOOGLE_ISSUER: 'http://localhost:4011',
      GOOGLE_CLIENT_ID: 'e2e-client',
      GOOGLE_CLIENT_SECRET: 'e2e-secret',
      GOOGLE_REDIRECT_URI: 'http://localhost:3001/auth/google/callback',
    },
  },
});
