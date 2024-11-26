import { PlaywrightTestConfig } from '@playwright/test';
import { CONFIG } from './config/env';

const config: PlaywrightTestConfig = {
  testDir: './tests',
  timeout: CONFIG.DEFAULT_TIMEOUT,
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15000,
    trace: 'on-first-retry',
  },
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],
};

export default config;