import { test, expect } from '@playwright/test';

test.describe('Jitsi Lazy-Load E2E Tests', () => {
  test('does not load external_api.js on page load, loads it only after clicking Join', async ({ page }) => {
    let apiRequests = 0;
    let blockedInit = 0;

    // Deterministic: intercept the Jitsi script so no real network is needed.
    await page.route('**/external_api.js', async (route) => {
      apiRequests++;
      await route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    });
    // A stubbed script means JitsiMeetExternalAPI will be undefined at init time;
    // the try/catch in week.njk must fall back to the plain-language error placeholder.
    page.on('pageerror', () => blockedInit++);

    await page.goto('http://localhost:8080/week/1/');

    // No external script tag in the served HTML (lazy-load only)
    await expect(page.locator('script[src*="meet.jit.si"]')).toHaveCount(0);
    expect(apiRequests).toBe(0);

    // Clicking replaces the placeholder with the embed (or a handled error fallback)
    await page.getByRole('button', { name: /Join Video Session/i }).click();
    await expect.poll(() => apiRequests).toBe(1);
    expect(blockedInit).toBe(0);
  });
});