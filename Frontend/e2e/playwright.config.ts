import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,

    reporter: [
        ['html'],
        ['list'],
        ['json', { outputFile: 'test-results.json' }]
    ],

    globalSetup: require.resolve('./global-setup'),

    use: {
        baseURL: 'http://localhost:8080',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    projects: [
        {
            name: 'admin',
            testDir: './tests/admin',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
    ],

    webServer: [
        {
            command: 'cd ../Backend && npm run dev',
            port: 5001,
            timeout: 120 * 1000,
            reuseExistingServer: !process.env.CI,
        },
        {
            command: 'npm run dev',
            port: 8080,
            timeout: 120 * 1000,
            reuseExistingServer: !process.env.CI,
        },
    ],
});
