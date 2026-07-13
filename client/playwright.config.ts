import { defineConfig, devices } from '@playwright/test';

const isWindows = process.platform === 'win32';
const backendCommand = isWindows
    ? 'cd ../server && mvnw.cmd test-compile -Dspring-boot.run.profiles=e2e spring-boot:test-run'
    : 'cd ../server && chmod +x mvnw && ./mvnw test-compile -Dspring-boot.run.profiles=e2e spring-boot:test-run';
const browserUse = process.env.CI
    ? { ...devices['Desktop Chrome'], launchOptions: { args: ['--disable-gpu'] } }
    : { ...devices['Desktop Chrome'], channel: 'chrome', launchOptions: { args: ['--disable-gpu'] } };

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
    use: {
        baseURL: 'http://127.0.0.1:3000',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'off',
    },
    projects: [
        {
            name: 'chromium',
            use: browserUse,
        },
    ],
    webServer: process.env.E2E_EXTERNAL_SERVERS ? undefined : [
        {
            command: backendCommand,
            url: 'http://127.0.0.1:3001/api/health',
            timeout: 180_000,
            reuseExistingServer: !process.env.CI,
        },
        {
            command: 'npm run dev',
            url: 'http://127.0.0.1:3000/login',
            timeout: 120_000,
            reuseExistingServer: !process.env.CI,
            env: {
                BACKEND_API_BASE_URL: 'http://127.0.0.1:3001',
            },
        },
    ],
});
