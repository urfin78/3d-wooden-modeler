// Playwright config for the smoke tests.
// Serves the repo root via http-server so module-style script loads behave the
// same as in the deployed GitHub Pages site.
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

const PORT = 4173;
const REPO_ROOT = path.resolve(__dirname, '..');

module.exports = defineConfig({
    testDir: '.',
    timeout: 30 * 1000,
    fullyParallel: false,
    reporter: [['list'], ['html', { open: 'never', outputFolder: path.join(REPO_ROOT, 'playwright-report') }]],
    use: {
        baseURL: `http://127.0.0.1:${PORT}`,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'off'
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
    ],
    webServer: {
        command: `npx http-server "${REPO_ROOT}" -p ${PORT} -c-1 --silent`,
        port: PORT,
        reuseExistingServer: !process.env.CI,
        timeout: 30 * 1000
    }
});
