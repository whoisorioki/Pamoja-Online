import { defineConfig } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    headless: true,
    baseURL: `file://${path.resolve('_site')}`,
  },
  webServer: {
    command: 'npx serve _site -p 8080',
    port: 8080,
    reuseExistingServer: true,
  },
});
