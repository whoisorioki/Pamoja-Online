import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js', 'tests/contract/**/*.test.js', 'tests/integration/**/*.test.js'],
    exclude: ['tests/e2e/**/*', 'node_modules/**/*'],
  },
});
