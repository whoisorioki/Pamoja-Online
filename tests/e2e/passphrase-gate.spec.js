import { test, expect } from '@playwright/test';

test.describe('Passphrase Gate E2E Tests', () => {
  test('verifies two-stage gating (token gate -> passphrase gate -> workspace)', async ({ page }) => {
    // 1. First visit without token -> token gate shown
    await page.goto('http://localhost:8080/forum/mens/');
    const tokenGate = page.locator('#forum-token-gate');
    const passGate = page.locator('#forum-passphrase-gate');
    const workspace = page.locator('#forum-workspace');

    await expect(tokenGate).toBeVisible();
    await expect(passGate).toBeHidden();
    await expect(workspace).toBeHidden();

    // 2. Set token -> passphrase gate shown
    await page.evaluate(() => {
      localStorage.setItem('nguvu_token', 'anchor-brave-calm');
    });
    await page.reload();

    await expect(tokenGate).toBeHidden();
    await expect(passGate).toBeVisible();
    await expect(workspace).toBeHidden();

    // 3. Mock failing passphrase check
    await page.route('**/rest/v1/rpc/is_valid_space_passphrase*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(false),
      });
    });

    const passInput = page.locator('#space-passphrase-input');
    await passInput.fill('wrongpass');
    await page.locator('#passphrase-submit-btn').click();

    // Verify error message shown and workspace remains hidden
    const errorMsg = page.locator('#passphrase-error-msg');
    await expect(errorMsg).toBeVisible();
    await expect(workspace).toBeHidden();
  });
});
