import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import { ENV_VARS, DEFAULT_VALUES } from './config/constants';

// Load environment variables from .env file
dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env[ENV_VARS.CI],
  retries: process.env[ENV_VARS.CI]
    ? parseInt(process.env[ENV_VARS.RETRIES] || DEFAULT_VALUES.RETRIES.CI)
    : parseInt(process.env[ENV_VARS.RETRIES] || DEFAULT_VALUES.RETRIES.LOCAL),
  workers: process.env[ENV_VARS.CI]
    ? parseInt(process.env[ENV_VARS.WORKERS] || DEFAULT_VALUES.WORKERS.CI)
    : parseInt(process.env[ENV_VARS.WORKERS] || DEFAULT_VALUES.WORKERS.LOCAL),

  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'gis-test-results.json' }],
  ],

  use: {
    baseURL: process.env[ENV_VARS.BASE_URL] || DEFAULT_VALUES.BASE_URL,
    trace:
      process.env[ENV_VARS.TRACE_ON_FAILURE] === 'true'
        ? 'on-first-retry'
        : 'off',
    screenshot:
      process.env[ENV_VARS.SCREENSHOT_ON_FAILURE] === 'true'
        ? 'only-on-failure'
        : 'off',
    video:
      process.env[ENV_VARS.VIDEO_ON_FAILURE] === 'true'
        ? 'retain-on-failure'
        : 'off',
    // Configurable timeouts for map and GIS operations
    actionTimeout: parseInt(
      process.env[ENV_VARS.ACTION_TIMEOUT] || DEFAULT_VALUES.ACTION_TIMEOUT
    ),
    navigationTimeout: parseInt(
      process.env[ENV_VARS.NAVIGATION_TIMEOUT] ||
        DEFAULT_VALUES.NAVIGATION_TIMEOUT
    ),
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
