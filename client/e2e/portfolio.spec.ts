import { expect, test, type Page } from '@playwright/test';

const captureScreenshots = process.env.PORTFOLIO_SCREENSHOTS === '1';

async function capture(page: Page, name: string) {
    if (captureScreenshots) {
        await expect(page.getByText('AsterFlow ERP', { exact: true }).first()).toBeVisible();
        await page.waitForTimeout(250);
        await page.locator('nextjs-portal').evaluateAll((elements) => elements.forEach((element) => element.remove()));
        await page.screenshot({
            path: `../docs/assets/${name}.png`,
        });
    }
}

test('管理员完成采购入库、销售出库并追溯库存与审计记录', async ({ page, request }) => {
    const health = await request.get('http://127.0.0.1:3001/api/health');
    expect(health.ok()).toBeTruthy();
    await expect(health.json()).resolves.toMatchObject({ status: 'UP' });

    await page.goto('/login');
    await expect(page.getByLabel('用户名')).toHaveValue('admin');
    await expect(page.getByLabel('密码')).toHaveValue('admin123');
    await capture(page, 'login');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'AsterFlow ERP Dashboard' })).toBeVisible();
    await capture(page, 'dashboard');

    const marker = `E2E-${Date.now()}`;
    await page.goto('/purchase-orders/new');
    await page.locator('form select').nth(0).selectOption({ index: 1 });
    await page.locator('form select').nth(1).selectOption({ index: 1 });
    await page.getByPlaceholder('数量').fill('3');
    await page.getByPlaceholder('请输入备注').fill(`${marker}-采购`);
    await page.getByRole('button', { name: '保存采购单' }).click();
    await expect(page).toHaveURL(/\/purchase-orders$/);

    const purchaseRow = page.getByRole('row').filter({ hasText: `${marker}-采购` });
    await expect(purchaseRow).toContainText('草稿');
    page.once('dialog', (dialog) => dialog.accept());
    await purchaseRow.getByRole('button', { name: '审核入库' }).click();
    await expect(purchaseRow).toContainText('已审核');
    await capture(page, 'purchase-orders');

    await page.goto('/sale-orders/new');
    await page.locator('form select').nth(0).selectOption({ index: 1 });
    await page.locator('form select').nth(1).selectOption({ index: 1 });
    await page.getByPlaceholder('数量').fill('1');
    await page.getByPlaceholder('请输入备注').fill(`${marker}-销售`);
    await page.getByRole('button', { name: '保存销售单' }).click();
    await expect(page).toHaveURL(/\/sale-orders$/);

    const saleRow = page.getByRole('row').filter({ hasText: `${marker}-销售` });
    await expect(saleRow).toContainText('草稿');
    page.once('dialog', (dialog) => dialog.accept());
    await saleRow.getByRole('button', { name: '审核出库' }).click();
    await expect(saleRow).toContainText('已审核');
    await capture(page, 'sale-orders');

    await page.goto('/stock-records');
    await expect(page.getByRole('row').filter({ hasText: 'P-1001' }).first()).toBeVisible();
    await expect(page.getByText('采购入库').first()).toBeVisible();
    await expect(page.getByText('销售出库').first()).toBeVisible();

    await page.goto('/audit-logs');
    await expect(page.getByRole('row').filter({ hasText: '采购审核' }).first()).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: '销售审核' }).first()).toBeVisible();
});
