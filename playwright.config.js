import { defineConfig, devices } from '@playwright/test';

// Local: levanta tests/server.mjs con las cabeceras de netlify.toml.
// Producción: BASE_URL=https://tu-sitio.netlify.app npm test
const remoto = process.env.BASE_URL;

export default defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: remoto || 'http://localhost:4173',
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } }],
  webServer: remoto ? undefined : { command: 'node tests/server.mjs', url: 'http://localhost:4173', reuseExistingServer: !process.env.CI },
});
